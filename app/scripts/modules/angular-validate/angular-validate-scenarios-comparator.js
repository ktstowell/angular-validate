'use strict';

/*******************************************************************************************************
 * ANGULAR VALIDATION COMPARATOR
 *******************************************************************************************************
 *
 * @description This scenario compares values from an indefinite number of fields to a master field.
 * @author Ken Stowell
 */
angular.module('ng-validation').factory('ngValidationScenariosComparator', function() {

  /*****************************************************************************************************
   * COMPARISON
   *****************************************************************************************************
   * @description Class exposed by ngValidationScenarios. The constructor takes a set of arguments
   *              to provide scope and options.
   */
  var Comparator = function(form, opts, root) {
    var self = this;

    // options fallback
    opts = opts || {};

    this.defaults = {
      master: false, // master element
      slaves: '', // slave elements
      fields: false, // all fields
      ui: {
        element: '',
        matched: '',
        unmatched: 'Fields do not match.'
      }
    }

    // Extend the options
    this.opts = root.extend(this.defaults, opts);
    // scopify root
    this.root = root;
    // Scopify form
    this.form = form;

    // Master element
    this.master = this.form.querySelectorAll(this.opts.master)[0]
    // Slaves
    this.slaves = this.form.querySelectorAll(this.opts.slaves);
    // Validate UI node for displayig message
    this.message = form.querySelectorAll(this.opts.ui.element)[0];
    // Should only be one master element
    root.bind_selectors(this.master, self.compare, {}, self);
    // Loop through slaves and apply event handlers
    for(var i=0, j=this.slaves; i<j.length; i++) {
      root.bind_selectors(j[i], self.compare, {}, self);
    }
  };

  Comparator.prototype.compare = function(el, e) {
    var self = this,
        unmatched = 0; // Final pass fail counter
    
    // If the event element is being triggered
    if(el === this.master) {
     // check slaves
     for(var i=0, j=this.slaves; i<j.length; i++) {
      // if the value doesn't match or is empty
      if(j[i].value !== el.value || j[i].value === '' || j[i].value === undefined) {
        // Increment counter
        unmatched++;
        // Display message
        this.message.textContent = this.opts.ui.unmatched;
        // Fail
        this.root.epic_fail(j[i], false, e);
      } else {
        // If the slave passes
        if(j[i].value === el.value && j[i].value !== '' || j[i].value !== undefined) {
          // Win!
          this.root.epic_win(j[i], false, e);
        }
      }
     }
    } else {
      // If the event element is a slave and doesn't not have the master's value
      if(el.value !== this.master.value || el.value == '' || el.value === undefined) {
        // Increment counter
        unmatched++;
        // Display failed message
        this.message.textContent = this.opts.ui.unmatched;
        // Fail
        this.root.epic_fail(el, false, e);
      } else {
        // Pass
        this.root.epic_win(el, false, e);
      }
    }

    // If no elements fail, display passed message
    if(unmatched === 0) {
      this.message.textContent = this.opts.ui.matched;
    }
  };

  return Comparator;
});