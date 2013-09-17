'use strict';

/********************************************************************************************************************************************************
 *  ANGULAR VALIDATION
 ********************************************************************************************************************************************************
 *
 * @description
 *
 * Angular validation aims to bring real-time, performant, accurate and easy to implement form validation to Angular.
 * Injectable through Angular's dependency system, using it is extremely easy and for most cases, injection is all
 * you will actually need to do.
 *
 *
 * @dependencies ngValidationRules  Without user modification, this compnent includes the default instance rule
 *                                  that determines the final pass/fail state of the form.
 *
 * @author  @ktstowell
 * @package https://github.com/ktstowell/angular-validate
 */
angular.module('ng-validation', []).factory('ngValidation', ['ngValidationRules', 'ngValidationScenarios', function(ngRules, ngScenarios) {

  /*******************************************************************************************************
   * VALIDATION LAYER
   *******************************************************************************************************
   * @description 
   * 
   * This layer includes the core of the validation processing. The constructor for this layer
   * immediately following this comment block accomplishes the following:
   *
   *  1.  Establishes the isntance options by either using the default rules or merging the user provided
   *      ones.
   *  2.  Establishes instance 'state' members that keep track of required and failed elements as well
   *      as load state
   *  3.  Validates the instance's submit button, which often returns empty when queried at run time.
   *  4.  Kicks off the validation core by calliing 'pre-validate' which runs all tasks considered
   *      pre-requisite to the actual validation.
   */
  var Validation = function(el, opts) {
    
    // Options
    opts = opts || false;

    ngRules = ngRules || (function() {throw "ngValidation: Dont forget to source the angular-validate-rules file in the DOM!"})();

    // Default parameters
    this.defaults = {
      rule: ngRules.default.rule, // Instance rule
      async: false, // Async mode
      passed_toggle: 'passed-validation', // Passed toggle default
      failed_toggle: 'failed-validation', // Failed toggle default
      show_failed_elements: true, // Updates the UI to show failed elements
      show_passed_elements: true, // Updates UI to show passed elements
      show_passed_on_load: false, // Updates UI on loadState 1, if true 
      show_failed_on_load: false, // Updates UI on loadState 1, if true
      groups: false, // Validation sub-groups
      group_toggle: 'ng-validation-group',
      exempt: [], // Array of items you wish not to be validated
      on_load: function() {}, //  Validation to be executed on page load
      ele_fail: function() {}, // Error callback
      ele_success: function() {}, // Success callback
      instance_fail: function() {}, // Error callback
      instance_success: function() {}, // Success callback
      submit_fail: function() {}, // Error callback
      submit_success: function() {}, // Success callback
      validator: false, // custom validator blocks
      submit: false, //  default submit to false
      submit_toggle: 'disabled', // CSS class or Attribute to add to submit button
      scenarios: false, // Validation scenarios
      events: {
        keydown: ['text', 'password', 'email', 'textarea', 'tel'],
        keyup: ['text', 'password', 'email', 'textarea', 'tel'],
        click: ['submit', 'checkbox', 'radio'],
        change: ['checkbox', 'radio', 'select'],
        paste: ['text', 'password', 'email', 'textarea', 'tel'],
        blur: ['text', 'password', 'email', 'textarea', 'tel'],
        mouseenter: [],
        mouseleave: []
      },
      ignore: ['header', 'div', 'section', 'p', 'ul', 'li', 'article', 'aside', 'video', 'audio' , 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'span', 'label', 'fieldset', 'legend']
    };

    // Merge validaiton options
    this.opts = (opts)? this.extend(this.defaults, opts) : this.defaults;

    // Members/shorthand options
    this.vChunk = el; // DOM chunk to parse for validation
    this.pt = this.opts.passed_toggle; // Passed toggle shorthand
    this.ft = this.opts.failed_toggle; // Failed toggle shorthand
    this.spe = this.opts.show_passed_elements; // Show passed elements shorthand
    this.sfe = this.opts.show_failed_elements; // Show passed elements shorthand
    this.sfol = this.opts.show_failed_on_load; // Show validation UI on immediate load
    this.spol = this.opts.show_passed_on_load; // Show validation UI on immediate load

    // Rule fallback incase they created a rule declaratively and forgot to actually add the rule in the rules class
    if(!this.opts.rule) {
      console.warn('ngValidation: rule was declared in DOM but not found in angular-validate-rules.js. Falling back to default rule');
      this.opts.rule = ngRules.default.rule;
    }

    // REQUIRED ELEMENTS:
    // Used in determining validation state on page load.
    this.required = [];

    // EXEMPT ELEMENTS:
    // Stores elements that are exempt from processing
    this.exempt = [];

    // FAILED ELEMENTS:
    // For any new validator, you must include a push to this array
    // if the item has failed, and a removal of the item if it passes/ is corrected
    this.failed = [];

    // GROUP FAIL
    // Tracks failed groups
    this.groups_failed = [];

    // LOAD STATES:
    this.loadState = 1;
    // Validation load states, add more as necessary:
    // The object below simply serves as an associative list,
    // nothing actually uses it. Purely referencial, just listed to give
    // meaning to the state numbers.
    this.loadStates = {1: 'Not Loaded', 2: 'Loaded'};

    // Submit shorthand and element validation
    if(this.opts.submit) {
      this.sbmt = this.opts.submit;
    } else {
      if(el.querySelectorAll('input[type=submit]').length > 0) {
        this.sbmt = el.querySelectorAll('input[type=submit]')[0];
      } else {
        if(el.querySelectorAll('button[type=submit]').length > 0) {
          this.sbmt = el.querySelectorAll('button[type=submit]')[0];
        } else {
          if(!this.opts.async) {
            throw "ngValidation: No submit button found and Async mode disabled, are you sure you need validation?";
          }
        }
      }
    }

    // Launch the validator
    this.pre_validate();
    
    // Return class object
    return this;
  };

  /**
   * PRE VALIDATE
   * @description: runs pre-validation tasks
   */
  Validation.prototype.pre_validate = function() {
    var self = this;

    // Build out exempt elements
    this.process_exempt(this.opts.exempt);

    // Process group-based event bindings and validation.
    (this.opts.groups)? this.process_groups() : '';

    // Build out required elements (bind events to them)
    this.process_required(this.vChunk);

    // Since we don't want to lump the submit button into the rest
    // of the validated group, we create a separate binding here.
    this.sbmt.addEventListener('click', function(e) {
      self.post_validate.call(self, this, e);
    }, false);

    // if any scenarios are found, run them
    if(this.opts.scenarios) {
      for(var i=0, j=this.opts.scenarios.length; i<j; i++) {
        new ngScenarios([this.opts.scenarios[i].name], this.vChunk, this.opts.scenarios[i].options, this)
      }
    }
    
    // Run the supplied on_load event
    this.opts.on_load.call(this);

    // If validate on load is set, run a pre user interaction
    // state check so that the form can't be submittable w/o user
    // action
    this.required.forEach(function(el, idx) {
      self.validate.call(self, el, idx);
    });
  };

  /**
   * PROCESS EXEMPT
   * @param  {DOM} el
   * @description: gets supplied exempt elements and turns them into the appropriate DOM pointers.
   */
  Validation.prototype.process_exempt = function(el) {
    var self = this,
        dom = []; // DOM query cache

    // Loops through captured collection
    for(var i=0;i<el.length;i++) {
      // If the DOM query actually returns anything
      if(this.vChunk.querySelectorAll(el[i]).length > 0) {
        // Cache it
        dom = this.vChunk.querySelectorAll(el[i]);
        // loop through result set
        for(var j =0; j<dom.length; j++) {
          // push to class array
          this.exempt.push(dom[j]);
        }
      }
    }
  };

  /**
   * PROCESS GROUPS
   *
   * @description Groups require special attention when compared to standalone elements.
   *              We need to assure that user desired relationships are kept intact while
   *              validating its fostered elements. For example, a user may specify a group of checboxes
   *              and only require one of them to be checked for the group's validation to pass. Here
   *              we have just implied that elements need to still be subjected to element validation,
   *              however since they belong to a group they should *not* increase the global validation count,
   *              just the groups validation.
   *
   *              Because of its abstraction from 'process_required' we have to double up on the 'onload' validation
   *              runner and the interaction with 'bind_selectors';
   *              
   * @options:
   *  1.  name: Group name, required
   *  2.  container: name of DOM container holding the elements, optional
   *  3.  required: list of required elements: optional if container spcified, required if no container specified.
   *  4.  number_required: number of elements considered to meet the requirement for the whole group to pass validation
   *
   */
  Validation.prototype.process_groups = function() {
    var self = this,
        groups = this.opts.groups,
        dom,
        req_dom;

    for(var i=0, g=groups.length; i<g; i++) {
      // inject a 'passed' property into each one
      // to be used by the 'group_validator'
      groups[i].passed = [];
      // check for container
      if(groups[i].container && groups[i].container !== undefined) {
        // Get the container within the validation block
        dom = this.vChunk.querySelectorAll(groups[i].container);
        if(dom.length > 0) {
          // Add the ng-group-validation attribute to any applicable block
          for(var d=0, dl=dom.length; d<dl; d++) {
            // set the attribute
            dom[d].setAttribute(this.opts.group_toggle, groups[i].name);
            // If the container hs specified required elements
            if(groups[i].required) {
              req_dom = dom[d].querySelectorAll(groups[i].required);
              for(var j=0, k=req_dom.length; j<k; j++) {
                this.bind_selectors(req_dom[j], self.group_validate, groups[i], self);
                // run a one time validation
                if(req_dom[j].nodeType === 1) {
                  this.group_validate(req_dom[j], groups[i]);
                }  
              }
            } else {
              // If in a container yet no required elements are specified, bind selectors to
              // everything
              for(var j=0, k=dom[d].childNodes.length; j<k; j++) {
                this.bind_selectors(dom[d].childNodes[j], self.group_validate, groups[i], self);
                // run a one time validation
                if(dom[d].childNodes[j].nodeType === 1) {
                  this.group_validate(dom[d].childNodes[j], groups[i]);
                }
              }
            }
          }
        }
      } else {
        // no container now, check the 'required' property
        if(groups[i].required) {
          dom = this.vChunk.querySelectorAll(groups[i].required);
          for(var d=0,dl=dom.length; d<dl; d++) {
            // Apply group tag
            dom[d].setAttribute(this.opts.group_toggle, groups[i].name);
            // Bind event listeners
            this.bind_selectors(dom[d], self.group_validate, groups[i], self);
            // run a one time validation
            if(dom[d].nodeType === 1) {
              this.group_validate(dom[d], groups[i]);
            }
          }
        } else {
          throw "No elements in group to parse. Please specify a container or required elements.";
        }
      }
    }
  };

  /**
   * PROCESS REQUIRED
   * @param  {DOM} el
   *
   * @description:  This library assumes the perspective of all elements being
   *                being required unless specififed otherwise. This method parses every element
   *                belonging to the form instance and as long as they:
   *                  1. Are of node type 1
   *                  2. Aren't exempt,
   *                  3. Not a submit button and
   *                  4. Don't belong to a group.
   *                and sends them off to have events attached to them.
   */
  Validation.prototype.process_required = function(el) {
    var self = this;

    // Start looping through child elements
    for(var i=0;i<el.childNodes.length;i++) {
      // If only of type element
      if(el.childNodes[i].nodeType === 1 &&
        // and not exempt
        this.exempt.indexOf(el.childNodes[i]) === -1 &&
          // and not the submit element
          el.childNodes[i] !== this.sbmt && !el.childNodes[i].hasAttribute(this.opts.group_toggle)) {
          // Only add to required array if not in ignore array
          if(this.opts.ignore.indexOf(el.childNodes[i].localName) === -1) {
            // add required class
            // el.childNodes[i].classList.add(this.opts.required);
            // Add to required array
            this.required.push(el.childNodes[i]);
          }
          // Bind events
          this.bind_selectors(el.childNodes[i], self.validate, '', self);
          // Recurse
          this.process_required(el.childNodes[i]);
      }
    }
  };

  /**
   * BIND SELECTORS
   * @param  {DOM} el
   *
   * @description: binds supplied selector with matching event types from the events object
   */
  Validation.prototype.bind_selectors = function(el, cb, cb_args, scope) {
    var self = this;

    // Start loop
    for(var ev in this.opts.events) {
      // If the event is applicable
      if(this.opts.events[ev] !== false) {
        // If input/elements to receive binding exist.
        for(var i=0; i<this.opts.events[ev].length; i++) {
          // if applicable elements match the event list
          if(el !== undefined && el.type === this.opts.events[ev][i]) {
            // Bind the event
            el.addEventListener(ev, function(e){
              // supplied callback - *ONLY ALLOW KEYDOWN ON DELETE KEY*
              // we may have to find other keycodes that do the same thing, e.g 46
              if(e.type !== "keydown" || e.type === "keydown" && e.keyCode === 8 || e.keyCode === 46) {
                // we 'dynamicize' the callback here as it can either be the group validator or the standalon validator
                cb.call(scope, this, cb_args, e);
              }
            }, false);
          }
        }
      }
    }
  };

  /**
   * VALIDATE
   * @param  {DOM} el
   *
   * @description   Standalone, e.g non-grouped elements validation.
   *                This runs each element's validators, runs a custom validator if provided
   *                and then calls the final UI pass/fail functions.
   */
  Validation.prototype.validate = function(el, args, e) {
    var self = this,
        validator = (this.validators[el.type]) ? el.type : 'text';

    el = el || {};
    
    // If the validator is found and passes
    if(this.validators[validator] && this.validators[validator].call(this, el)) {
      // If a custom validator is found and returns true
      if(this.opts.validator[el.type]) {
        // If it passes
        if(this.opts.validator[el.type].call(this, el, args, e)) {
          // Both stock, custom pass
          this.epic_win(el, false, e)
        } else {
          // Custom failed
          this.epic_fail(el, false, e);
        }
      } else {
        // Stock validator passed, custom validator not found === validation-passed.
        this.epic_win(el, false, e);
      }
    } else {
      // stock validator failed
      this.epic_fail(el, false, e);
    }

    // Process ready State
    // basically, the 'show passed or failed elements on load' settings off by default
    // so this is a way to decouple the UI helpers and still run the actual validation so 
    // that the form isn't submittable. We do this by a simple load state definition.
    // if the onload validation index equals the number of required elements, we can say that
    // the validation is fully loaded and jsut waiting for user input. This has no tie-in to groups
    // at the moment. It may need to eventually but as for now it just doesn't.
    if(typeof args == 'number' && args === this.required.length-1) {
      this.loadState = 2; // Loaded
    }
  };

  /**
   * GROUP VALIDATION
   *
   * @description Event callback for the grouped elements.
   * @param {DOM} el dom element
   * @param {String} group group name
   * @param {Object} e event object
   */
  Validation.prototype.group_validate = function(el, group, e) {
    var self = this,
        validator = (this.validators[el.type]) ? el.type : 'text';

    // Fallback because there is no event on
    // pageload.
    e = e || {};

    if(this.validators[validator]) {
      // If it passes:
      if(this.validators[validator](el, e)) {
        // If a custom validator exists
        if(this.opts.validator[el.type]) {
          // If the custom passes
          if(this.opts.validator[el.type].call(this, el, e)) {
            // Update the group passed object
            if(group.passed.indexOf(el) === -1) {
              group.passed.push(el);
            }
            this.epic_win(el, true, e);
          } else {
            // Custom failed, update the group passed object
            if(group.passed.indexOf(el) !== -1) {
              group.passed.splice(group.passed.indexOf(el), 1);
            }
            this.epic_fail(el, true, e);
          }
        } else {
          // No custom validator yet stock validator passed. Update group passed property.
          if(group.passed.indexOf(el) === -1) {
            group.passed.push(el);
          }
          this.epic_win(el, true, e);
        }
      } else {
        // Stock validator failed, update group passed property
        if(group.passed.indexOf(el) !== -1) {
          group.passed.splice(group.passed.indexOf(el), 1);
        }
        this.epic_fail(el, true, e)
      }
    } else {
      throw "ngValidation: specified and fallback validtor not found. Hmmmm, this shouldn't happen."
    }
    
    // Compare the group passed object with the group rule.
    if(group.passed.length >= group.number_required) {
      // Passed meets number_required criteria, update the groups_failed array
      // if the index already exists
      if(this.groups_failed.indexOf(group.name) !== -1) {
        this.groups_failed.splice(this.groups_failed.indexOf(group.name), 1);
      }
    } else {
      // Passed does not meet required criteria
      if(this.groups_failed.indexOf(group.name) === -1) {
        // add to groups failed array if not already there.
        this.groups_failed.push(group.name);
      }
    }
  };

  /**
   * EPIC WIN
   * @param  {[type]} el
   * @return {[type]}
   */
  Validation.prototype.epic_win = function(el, group, e) {
    // Update failed collection
    if(!group) this.total_passed(el);
    // Only toggle the UI helper on required elements
    if(this.required.indexOf(el) !== -1 || group) {
      if(this.loadState === 2 || this.spol && this.loadState === 1) {
        // If the UI helper is true, add the style class
        if(this.spe) el.classList.add(this.pt);
        // remove a failed class regardless
        el.classList.remove(this.ft);
        // run element success callback
        this.opts.ele_success.call(this, el, e);
      }
    }
    // Run the instance rule.
    this.instance_rule(el, e)
  };

  /**
   * EPIC FAIL
   * @param  {[type]} el
   * @return {[type]}
   */
  Validation.prototype.epic_fail = function(el, group, e) {
    // Update failed collection
    if(!group) this.total_failed(el)
    // Only bother with the UI helper on required elements
    if(this.required.indexOf(el) !== -1 || group) {
      if(this.loadState === 2 || this.sfol && this.loadState === 1) {
        // If the UI helper is true, add the style class
        if(this.sfe) el.classList.add(this.ft);
        // remove passed class regardless
        el.classList.remove(this.pt);
        // run element fail callback
        this.opts.ele_fail.call(this, el, e);
      }
    }
    // Run the instance rule.
    this.instance_rule(el, e)
  };

  /**
   * INSTANCE RULE
   * @param  {DOM} el active event element
   * @param  {OBJ} e  active event object
   * @description: The global rule for the final pass/fail
   */
  Validation.prototype.instance_rule = function(el, e) {
    var self = this;
    
    el = el || []; // Element fallback
    e = e || {}; // Event object fallback
    
    // If there'sa rule in the options
    if(this.opts.rule) {
      // if it passes
      if(this.opts.rule.call(this, this.vChunk, el, e)) {
        // Remove the disabled toggle
        this.sbmt.removeAttribute(this.opts.submit_toggle);
        // Run success callback
        this.opts.instance_success.call(this, this.vChunk);
      } else {
        // Failed: add the disabled toggle
        this.sbmt.setAttribute(this.opts.submit_toggle, true);
        // Run fail callback
        this.opts.instance_fail.call(this, this.vChunk);
      }
    }
  };

  /**
   * @todo: this might not be needed now that we're using the browser 'disabled'.
   * 
   * POST VALIDATE
   * @param  {DOM} el
   * @param  {jQuery event obj} e
   * @return {bool}
   */
  Validation.prototype.post_validate = function(el, e) {
    var self = this;

    // If form values aren't submitted w/o a submit button
    if(!this.opts.async) {
      // This block exists in case the user doesn't use a native submit button
      // for the form and simply attaches a click event to something else.
      // When an actuall submit button is flagged as disabled, this event will never fire.
      // If were to be something else, we'd need to prevent default on fail, passthrough on success.
      // If 'disabled', don't allow submission
      if(el.hasAttribute(this.opts.submit_toggle)) {
        // Failure callback
        this.opts.submit_fail.call(this);
        // prevent link, capture both just in case.
        e.preventDefault(); return false;
      } else {
        // Success callback
        this.opts.submit_success.call(this);
        // Allow the event trigger
        return true;
      }
    }
  };

  /**
   * TOTAL FAILED
   *
   * @description Adds failed elements to the failed array if not already present
   * @param  {DOM} el
   */
  Validation.prototype.total_failed = function(el) {
    if(this.failed.indexOf(el) === -1) {
      this.failed.push(el);
    }
  };

  /**
   * TOTAL PASSED
   *
   * @description Removes elements from the failed array if they exist
   * @param  {DOM} el
   */
  Validation.prototype.total_passed = function(el) {
    if(this.failed.indexOf(el) !== -1) {
      this.failed.splice(this.failed.indexOf(el), 1);
    }
  };

  /**
   * EXTEND
   *
   * @description Utility function to merge two objects together recursively.
   * @return {Object} merged object
   */
  Validation.prototype.extend = function(src, ext) {
   (function copy(src, ext) {
    for(var key in ext) {
      if(typeof src[key] === 'object') {
        // if a child is an opject, recurse
        copy(src[key], ext[key]);
      } else {
        src[key] = ext[key];
      }
    }
   })(src, ext);

   // return modified src
   return src;
  };

  /**
   * VALIDATORS
   * @type {Object}
   *
   * @description: Object that houses the element specific, default validators.
   *               If a validator that does not exist is requested, it falls back
   *               to text validation.
   */
  
  Validation.prototype.validators = {
    /**
     * TEXT VALIDATOR
     * @description text field validator
     * @param  {DOM} text type element
     * @param  {jQuery event obj} event attached to element
     */
    text: function(el, e) {
      var val = el.value;
      
      // Null or empty check
      if (val !== '' && val !== undefined && val !== null) {
        return true;
      } else {
        return false;
      }
    },
    /**
     * EMAIL VALIDATOR
     * @description email field validator
     * @param  {DOM} email type element
     * @param  {jQuery event obj} event attached to element
     */
    email: function(el, e) {
      var val = el.value;

      // Null or empty check
      if (val !== '' && val !== undefined && val !== null) {
        if(val.match(/^[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*/i)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    },
    /**
     * PASSWORD VALIDATOR
     * @description password field validator
     * @param  {DOM} password type element
     * @param  {jQuery event obj} event attached to element
     */
    password:  function(el, e) {
      var val = el.value;

      // Null or empty check
      if (val !== '' && val !== undefined && val !== null) {
        return true;
      } else {
        return false;
      }
    },
    /**
     * TELEPHONE VALIDATOR
     * @param  {[type]} el [description]
     * @param  {[type]} e  [description]
     * @return {[type]}    [description]
     */
    tel: function(el, e) {
      var val = el.value;
      // Default null/empty check
      if(val !== '' && val !== undefined && val !== null) {
        if(val.match(/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    },
    /**
     * CHECKBOX VALIDATOR
     * @param  {DOM} checkbox type element
     * @param  {jQuery event obj} event attached to element
     */
    checkbox: function(el, e) {
      if(el.checked) {return true} else {return false}
    },
    /**
     * RADIO VALIDATOR
     * @param  {DOM} radio type element
     * @param  {jQuery event obj} event attached to element
     */
    radio: function(el, e) {
     if(el.checked) {return true} else {return false}
    },
    /**
     * TEXTAREA
     * @description textarea validator
     * @param  {DOM} checkbox type element
     * @param  {jQuery event obj} event attached to element
     */
    textarea: function(el, e) {
      var val = el.value;

      // Null, empty, undefined and no new line at the beginning.
      if (val !== '' && val !== undefined && val !== null && 
        val.match(/^\n/) === null) {
        return true;
      } else {
        return false;
      }
    }
  };

  /*******************************************************************************************************
   * VALIDATION INSTANTIATION LAYER
   *******************************************************************************************************
   * @description Loads validation class
   * @author         
   */
  var API = {};

  /**
   * VERSION NUMBER
   * @type {String}
   */
  API.version = '0.3.3';

  /**
   * ADD RULE
   * @param {String} name name of rule
   * @param {Object} rule rule object
   */
  API.add_rule = function(name, rule) {
    var bad = "@!#$%^&*(){}[]/-+=|\"' ";
    var isBad = [];

    // Check for bad name characters.
    for(var i=0, j=name; i<j.length; i++) {
      for(var k=0, l=bad; k<l.length; k++) {
        if(j.charAt(i) == l[k]) {
          isBad.push(l[k]);
        }
      }
    }
    
    // If no bad characters found
    if(isBad.length === 0) {
      // If rule has an existing name
      if(ngRules.hasOwnProperty(name)) {
        // Just warn teh console and proceed.
        console.warn('ngValidation: Form ['+name+'] already exists, overwriting.')
      }
      // Add of rules object
      ngRules[name] = rule;
    } else {
      // Bad characters found, notify the user.
      throw "ngValidation: add_rule error, please use only alpha-numeric characters or _ (underscores) for the name. Rule [ "+name+" ] contained: [ "+isBad+" ]";
    }

    // Return chainable object
    return API;
  };

  /**
   * INIT
   * @description Crawls the page for ng-validation attribtes, launches form validation.
   * @return {Object} API object.
   */
  API.init = function() {
    var qualifier = 'ng-validation', // String for DOM detection
        rules = ngRules, // Angular Rules
        selector = document.querySelectorAll('*['+qualifier+']');

    // Loop through DOM reuslt set.
    for(var i=0,j=selector.length; i<j; i++) {
      // We don't do any error checking here because the Validation class provides the fallback.
      // We simply warn the console that we will be using defaults
      if(!rules.hasOwnProperty(selector[i].getAttribute(qualifier))) {
        console.warn('ngValidation: Rule [ '+selector[i].getAttribute(qualifier)+' ] declared in DOM but not found in Rules object. Using defaults. Make sure to \n use [ngValidation.add_rule] to add a custom rule.');
      }
      // Instatiate new validation instance with DOM and rule.
      new Validation(selector[i], rules[selector[i].getAttribute(qualifier)]);
    }

    // Return chainable object.
    return API;
  };

  // return API as ngValidation
  return API;
}]);
