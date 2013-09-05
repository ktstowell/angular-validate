'use strict';

/*******************************************************************************************************
 * ANGULAR VALIDATION Password Strength Scenario
 *******************************************************************************************************
 *
 * @description This scenario assesses password strength and effects form validity
 * @author Ken Stowell
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
          id:3, // Id's used in relationship building
          uppercase: 3, // Minimum uppsercase chars to be considered 'strong'
          number: 3, // Minimum numbers to be considered 'strong'
          special: 3, // Minimum number of special chars to be considered 'strong'
          length: 15, // Required character count
          ui: 'Could defeat a small clan of ninjas.'
        },
        medium: {
          id:2,
          uppercase: 1,
          number: 1,
          special: 1,
          length: 8,
          ui: 'Meh'
        },
        weak: {
          id:1,
          uppercase: 0,
          number: 0,
          special: 0,
          length: 5,
          ui: 'pansy'
        }
      },
      acceptance: 'strong', // What level needs to be meet to be considered valid
      ui : '' // DOM, empty by default.
    };
    
    // Merge options
    this.opts = root.extend(this.defaults, opts);
    // DOM
    this.password = form.querySelectorAll('input[type="password"]')
    // Sate DOM
    this.state_ui = (this.opts.ui)? form.querySelectorAll(this.opts.ui)[0] : [];
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
        next_standard, // used to get visibilty into the next standard up in the chain
        values = { // Object to hold regex return vals.
          uppercase: 0,
          number: 0,
          special: 0,
          length: 0
        };

    // Number of uppercase characters
    values.uppercase = val.replace(/[^A-Z]/g, "").length;
    // Number of numbers
    values.number = val.replace(/[^0-9]/g, "").length;
    // Number of special Characters
    values.special = val.replace(/[^\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\{|\}|\[|\]]/g, "").length;
    // Length
    values.length = val.length;
    
    // Find the next standard
    for(var standard in self.opts.standards) {
      for(var criteria in self.opts.standards[standard]) {
        next_standard = (standard == 'weak')? 'medium' : 
          (standard == 'medium')? 'strong' 
            : false;
        
        // Loop through all criteria except ui, length and id.
        if(criteria !== "ui" && criteria !== "length" && criteria !== "id" && values[criteria] !== undefined) {
          // if the values are less than the current criteria
          if(values[criteria] <= self.opts.standards[standard][criteria]) {
            // Set to current standard
            self.strengths[criteria] = standard;
          } else {
            // If a next standard is there i.e we aren't at the cieling
            if(next_standard) {
              // If the current values are now greater than the current standard but less than the next standard
              if(values[criteria] < self.opts.standards[next_standard][criteria]) {
                // keep the array at the same standard
                self.strengths[criteria] = standard;
              }
            } else {
              // No next standard present, set to current.
              self.strengths[criteria] = standard;
            }
          }
        }
      }
    }
    // Process acceptance
    this.process_acceptance(el, e);
  };

  /**
   * PROCESS ACCEPTANCE
   * @param  {DOM} el Event element
   * @param  {Object} e  Event object
   * @description [description]
   */
  PasswordStrength.prototype.process_acceptance = function(el, e) {
    var self = this,
        strengths = {weak:0, medium: 0, strong:0}, // Counter
        arr = [], // Array used in determining highest counter
        max, // Max/highest counter
        state = 'weak'; // Default state when this function gets called

    // Loop through strengths and increment counters.
    for(var item in this.strengths) {
      if(strengths[this.strengths[item]] !== undefined) {
        strengths[this.strengths[item]]++;
      }
    }

    // Convert object keys into an array
    arr = Object.keys(strengths).map(function(key) {
      return strengths[key];
    });

    // Get the largest key
    max = Math.max.apply(null, arr);

    // Loop through local strength counter
    for(var strength in strengths) {
      // If this value of the strength counter
      // is the highest in the strengths object
      if(strengths[strength] === max) {
        // Assign the state
        state = strength;
        // Update the UI
        this.state_ui.textContent = this.opts.standards[state].ui;
        // Here we break upon matching because it is possible for
        // 'max' to match to two or more strengths. Since the parsing is top down, we can
        // stop at the first encounter. This prevents it from being 'strong' in situations when weak and strong
        // have the same counter.
        break;
      }
    };

    // Always ensure the character count.
    if(el.value.length >= this.opts.standards[this.opts.acceptance].length) {
      // If the standard id is greater than or equal to the acceptance id.
      // This ensures that if a form specifies 'medium' as their acceptance, strong will still
      // work since strong > medium.
      if(this.opts.standards[state].id >= this.opts.standards[this.opts.acceptance].id) {
        // Win!
        this.root.epic_win(el, false, e);
      } else {
        // fail
        this.root.epic_fail(el, false, e);
      }
    } else {
      // fail
      this.root.epic_fail(el, false, e);
    }
  };
  
  // Return reference.
  return PasswordStrength;
 });
