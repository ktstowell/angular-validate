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
          ui: 'Could defeat a small clan of ninjas.',
          score: 28
        },
        medium: {
          length: 8,
          ui: 'Meh',
          score: 15
        },
        weak: {
          length: 5,
          ui: 'pansy',
          score: 8
        }
      },
      acceptance: 'strong', // What level needs to be meet to be considered valid
      ui : '' // DOM, empty by default.
    };
    
    // Scenario score meter
    this.score;
    // Value point system, totally arbitrary but immutable by user
    this.values = {length: 1, uppercase: 4, number: 4, special: 6};
    // Merge options
    this.opts = root.extend(this.defaults, opts);
    // DOM
    this.password = form.querySelectorAll('input[type="password"]')
    // Sate DOM
    this.strength_ui = (this.opts.ui)? form.querySelectorAll(this.opts.ui)[0] : [];
    // Criteria tracker
    this.strengths = {uppercase: 'weak', number: 'weak', special: 'weak'};
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

    // Update the UI based on score
    if(this.score >= this.opts.standards.strong.score) {
      // Strong or higher
      this.strength_ui.textContent = this.opts.standards.strong.ui;
    } else if (this.score >= this.opts.standards.medium.score) {
      // Medium or higher
      this.strength_ui.textContent = this.opts.standards.medium.ui;
    } else if (this.score < this.opts.standards.medium.score) {
      // Less than medium
      this.strength_ui.textContent = this.opts.standards.weak.ui;
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
  
  // Return reference.
  return PasswordStrength;
 });
