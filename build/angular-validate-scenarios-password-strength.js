'use strict';

/*******************************************************************************************************
 * ANGULAR VALIDATION Password Strength Scenario
 *******************************************************************************************************
 *
 * @description This scenario assesses password strength and effects form validity
 * @author Ken Stowell
 *
 * ## Refactor Thoughts:
 *
 * 
 */
 angular.module('ng-validation').factory('ngValidationScenariosPasswordStrength', function() {
  /*******************************************************************************************************
   * PASSWORD STRENGTH
   *******************************************************************************************************
   * @description Class exposed by ngValidationScenarios. The constructor takes a set of arguments
   *              to provide scope and options.
   */
  var PasswordStrength = function(form, opts, root) {
    var self = this;

    // Default options object
    this.defaults = {
      standards: {
        strong: {
          length: 12,
          ui: 'Strong',
          score: 28
        },
        medium: {
          length: 8,
          ui: 'Medium',
          score: 15
        },
        weak: {
          length: 5,
          ui: 'Weak',
          score: 8
        }
      },
      acceptance: 'strong', // What level needs to be meet to be considered valid
      ui : '' // DOM, empty by default.
    };
    
    // Scenario score meter
    this.score;
    // Value point system, totally arbitrary but immutable by user
    this.values = {length: 1, uppercase: 3, number: 4, special: 6};
    // Merge options
    this.opts = root.extend(this.defaults, opts);
    // DOM
    this.password = form.querySelectorAll('input[type="password"]')
    // Sate DOM
    this.strength_ui = (this.opts.ui)? form.querySelectorAll(this.opts.ui)[0] : false;
    // Root class, passed in as argument
    this.root = root;
    // Set up event bindings
    for(var i=0, j=this.password.length; i<j; i++) {
      // bind the event listener
      root.bind_selectors(this.password[i], self.check_password_strength, this.password[i], self);
      // Run once for onload:
      this.check_password_strength(this.password[i]);
    }
  };

  /**
   * CHECK PASSWORD STRENGTH
   * @param  {DOM} el Event target element
   * @param  {Object} e  Event Object
   * @description This is the bulk of the scenario work. This analyzes the string on each event trigger
   *              to ensure the password meets the standards which then is analyzed for acceptance.
   */
  PasswordStrength.prototype.check_password_strength = function(el, e) {
    var self = this,
        keys, // Array-ified version of Standards
        scores = [], // Array of score
        val = el.value, // String value of dom target
        values = { // Object to hold regex return vals.
          uppercase: 0,
          number: 0,
          special: 0,
          length: 0
        };

    // Set the score to 0 in every callback - it's easier than tracking state
    this.score = 0;
    // Number of uppercase characters
    values.uppercase = val.replace(/[^A-Z]/g, "").length;
    // Number of numbers
    values.number = val.replace(/[^0-9]/g, "").length;
    // Number of special Characters
    values.special = val.replace(/[^\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\{|\}|\[|\]]/g, "").length;
    // Length
    values.length = val.length;

    // Calculate the score
    for(var value in values) {
      // times the number of occurences with the point values
      this.score += (values[value] * this.values[value])
    }

    // If the standard has a strength UI.
    if(this.strength_ui) {
      // Because the standards themselves are muteable, we need to account for an indefinite number
      // of standards in an unenforceable order.
      // The first task is to get the scores, and sort them ascending:
      this.scores = Object.keys(this.opts.standards).map(function(key) {
        return self.opts.standards[key].score;
      }).sort(function(a, b) {
        return a - b;
      });
      
      // Then we call our recursive updater
      this.show_strength_ui(this.scores);
    }

    // If the score meets the acceptance
    if(this.score >= this.opts.standards[this.opts.acceptance].score) {
      // Always ensure the character count.
      if(val.length >= this.opts.standards[this.opts.acceptance].length) {
        // Win!
        this.root.epic_win(el, false, e);
      } else {
        // Score meet the acceptance but is still too short: fail
        this.root.epic_fail(el, false, e);
      }
    } else {
      // Score didn't meet acceptance: fail
      this.root.epic_fail(el, false, e);
    }
  };

  /**
   * SHOW STRENGTH UI
   * @param  {Array} scores Array of scores to compare
   * @description This function does quite a bit of work. It compares a numerically sorted by ascending
   *              array to determine what standard UI it can show.
   */
  PasswordStrength.prototype.show_strength_ui = function(scores) {
    var self = this, // scope
        mid_scores = [], // Array to hold middle values
        mids_max = Math.max.apply(null, scores), // Highest score in scores
        mids_min = Math.min.apply(null, scores); // Lowest score in scores
        
    // Begin by looping through the standards
    for(var standard in this.opts.standards) {
      // If the score is the lowest one
      if(this.score <= this.opts.standards[standard].score && this.opts.standards[standard].score <= mids_min) {
        // Update the UI
        this.strength_ui.textContent = this.opts.standards[standard].ui;
      } else {
        // This conditional captures every score that isn't min or max.
        if(this.score > mids_min && this.score < mids_max && this.opts.standards[standard].score > mids_min && this.opts.standards[standard].score < mids_max) {
          // Push to the temp array which is used as the recursive set of params.
          mid_scores.push(this.opts.standards[standard].score);
          // Recurse
          this.show_strength_ui(mid_scores);
        } else {
          // If it's the highest score
          if(this.score >= this.opts.standards[standard].score && this.opts.standards[standard].score >= mids_max) {
            // Update the UI
            this.strength_ui.textContent = this.opts.standards[standard].ui;
          }
        }
      }
    }
  };
  
  // Return reference.
  return PasswordStrength;
 });
