/**
 * PrimeFaces AutoComplete Widget
 */
PrimeFaces.widget.AutoComplete = function(id, cfg) {
    this.id = id;
    this.cfg = cfg;
    this.jqId = PrimeFaces.escapeClientId(this.id);
    this.jq = $(this.jqId);
    this.panelId = this.jqId + '_panel';
    this.input = $(this.jqId + '_input');
    this.hinput = $(this.jqId + '_hinput');
    this.panel = this.jq.children(this.panelId);
    this.dropdown = this.jq.children('.ui-autocomplete-dropdown');
    this.disabled = this.input.is(':disabled');
    this.active = true;
    
    //options
    this.cfg.minLength = this.cfg.minLength ? this.cfg.minLength : 1;
    this.cfg.delay = this.cfg.delay ? this.cfg.delay : 300;
    
    //visuals
    if(this.cfg.theme != false) {
        PrimeFaces.skinInput(this.input);
    }
    
    //core events
    this.bindStaticEvents();
    
    //force selection
    if(this.cfg.forceSelection) {
        this.setupForceSelection();
    }
    
    //Panel management
    $(document.body).children(this.panelId).remove();
    this.panel.appendTo(document.body);
}

PrimeFaces.widget.AutoComplete.prototype.bindStaticEvents = function() {
    var _self = this;
    
    //bind keyup handler
    this.input.keyup(function(e) {
        var keyCode = $.ui.keyCode,
        key = e.which,
        shouldSearch = true;
        
        if(key == keyCode.UP 
            || key == keyCode.LEFT 
            || key == keyCode.DOWN 
            || key == keyCode.RIGHT 
            || key == keyCode.TAB 
            || key == keyCode.ENTER
            || key == keyCode.NUMPAD_ENTER) {
            shouldSearch = false;
        }

        if(shouldSearch) {
            var value = _self.input.val();
        
            if(value.length >= _self.cfg.minLength) {

                //Cancel the search request if user types within the timeout
                if(_self.timeout) {
                    clearTimeout(_self.timeout);
                }

                _self.timeout = setTimeout(function() {
                                    _self.search(value);
                                }, 
                                _self.cfg.delay);
            }
        }
 
    });
  
    //key events
    this.input.keydown(function(e) {
        if(_self.panel.is(':visible')) {
            var keyCode = $.ui.keyCode,
            currentItems = _self.panel.find('.ui-autocomplete-item'),
            highlightItem = _self.panel.find('.ui-autocomplete-item.ui-state-highlight');
        
            switch(e.which) {
                case keyCode.UP:
                case keyCode.LEFT:
                    if(highlightItem.length > 0) {
                        highlightItem.removeClass('ui-state-highlight').prev().addClass('ui-state-highlight');
                    } else {
                        currentItems.eq(currentItems.length - 1).addClass('ui-state-highlight');
                    }

                    e.preventDefault();
                    break;

                case keyCode.DOWN:
                case keyCode.RIGHT:
                    if(highlightItem.length > 0) {
                        highlightItem.removeClass('ui-state-highlight').next().addClass('ui-state-highlight');
                    } else {
                        currentItems.eq(0).addClass('ui-state-highlight');
                    }

                    e.preventDefault();
                    break;

                case keyCode.ENTER:
                case keyCode.NUMPAD_ENTER:
                    highlightItem.click();

                    e.preventDefault();
                    break;

                case keyCode.ALT: 
                case 224: 
                    break;

                case keyCode.TAB: 
                    _self.hide();
                    break;
             }
        }
         
    });
    
    //dropdown
    this.dropdown.mouseover(function() {
        if(!_self.disabled) {
            $(this).addClass('ui-state-hover');
        }
    }).mouseout(function() {
        if(!_self.disabled) {
            $(this).removeClass('ui-state-hover');
        }
    }).mousedown(function() {
        if(!_self.disabled && _self.active) {
            $(this).addClass('ui-state-active');
        }
    }).mouseup(function() {
        if(!_self.disabled && _self.active) {
            $(this).removeClass('ui-state-active');
            
            _self.search('');
        }
    });

    //hide overlay when outside is clicked
    var offset;
    $(document.body).bind('click', function (e) {
        if(_self.panel.is(":hidden")) {
            return;
        }
        offset = _self.panel.offset();
        if(e.target === _self.input.get(0)) {
            return;
        }
        if (e.pageX < offset.left ||
            e.pageX > offset.left + _self.panel.width() ||
            e.pageY < offset.top ||
            e.pageY > offset.top + _self.panel.height()) {
            _self.hide();
        }
        _self.hide();
    });
}

PrimeFaces.widget.AutoComplete.prototype.bindDynamicEvents = function() {
    var _self = this,
    items = this.panel.find('.ui-autocomplete-item');
    
    //visuals and click handler for items
    items.bind('mouseover', function() {
        $(this).addClass('ui-state-highlight');
    })
    .bind('mouseout', function() {
        $(this).removeClass('ui-state-highlight');
    })
    .bind('click', function(event) {
        var item = $(this);
        
        _self.input.val(item.attr('data-item-label'));
        
        if(_self.cfg.pojo) {
            _self.hinput.val(item.attr('data-item-value'));            
        } 

        _self.invokeItemSelectBehavior(event);
    });
}

PrimeFaces.widget.AutoComplete.prototype.search = function(value) {
    if(!this.active) {
        return;
    }
    
    var _self = this;
    
    //start callback
    if(this.cfg.onstart) {
        this.cfg.onstart.call(this, value);
    }

    var options = {
        source: this.id,
        process: this.id,
        update: this.id,
        formId: this.cfg.formId,
        onsuccess: function(responseXML) {
            var xmlDoc = responseXML.documentElement,
            updates = xmlDoc.getElementsByTagName("update");

            for(var i=0; i < updates.length; i++) {
                var id = updates[i].attributes.getNamedItem("id").nodeValue,
                data = updates[i].firstChild.data;

                if(id == _self.id) {
                    _self.panel.html(data);
                    _self.bindDynamicEvents();
                    
                    var items = _self.panel.find('.ui-autocomplete-item');
                    
                    if(items.length > 0) {
                        if(_self.cfg.forceSelection) {
                            _self.cachedResults = [];
                            items.each(function(i, item) {
                               _self.cachedResults.push($(item).attr('data-item-label'));
                            });
                        }
                        
                        if(_self.panel.is(':hidden')) {
                            _self.show();
                        }

                        //adjust height
                        _self.panel.css('height', '');
                        if(_self.cfg.scrollHeight && _self.panel.height() > _self.cfg.scrollHeight) {
                            _self.panel.css('height', _self.cfg.scrollHeight + 'px');
                        }
                    } 
                    else {
                        _self.panel.hide();
                    }
                } 
                else {
                    PrimeFaces.ajax.AjaxUtils.updateElement(id, data);
                }
            }

            return true;
        }
    };
    
    //complete callback
    if(this.cfg.oncomplete) {
        options.complete = this.cfg.oncomplete;
    }

    if(this.cfg.global === false) {
        options.global = false;
    }

    var params = {};
    params[this.id + '_query'] = encodeURIComponent(value);

    options.params = params;

    PrimeFaces.ajax.AjaxRequest(options);
}

PrimeFaces.widget.AutoComplete.prototype.show = function() {
    this.alignPanel();
    this.panel.css('z-index', '100000');
    
    if($.browser.msie && /^[6,7]\.[0-9]+/.test($.browser.version)) {
        this.panel.parent().css('z-index', '99999');
    }

    if(this.cfg.effect)
        this.panel.show(this.cfg.effect, {}, this.cfg.effectDuration);
    else
        this.panel.show();
}

PrimeFaces.widget.AutoComplete.prototype.hide = function() {
    if($.browser.msie && /^[6,7]\.[0-9]+/.test($.browser.version)) {
        this.panel.parent().css('z-index', '');
    }
    
    this.panel.css('z-index', '').hide();
}

PrimeFaces.widget.AutoComplete.prototype.invokeItemSelectBehavior = function(event) {
    if(this.cfg.behaviors) {
        var itemSelectBehavior = this.cfg.behaviors['itemSelect'];

        if(itemSelectBehavior) {
            itemSelectBehavior.call(this, event);
        }
    }
}

PrimeFaces.widget.AutoComplete.prototype.setupForceSelection = function() {
    var _self = this;
	
    this.input.blur(function() {
        var value = $(this).val(),
        valid = false;
		
        if(_self.cachedResults) {
            for(var i = 0; i < _self.cachedResults.length; i++) {
                if(_self.cachedResults[i] == value) {
                    valid = true;
                    break;
                }
            }
        }
		
        if(!valid) {
            $(this).val('');
        }
    });
}

PrimeFaces.widget.AutoComplete.prototype.disable = function() {
    this.disabled = true;
    this.input.addClass('ui-state-disabled').attr('disabled', 'disabled');
}

PrimeFaces.widget.AutoComplete.prototype.enable = function() {
    this.disabled = false;
    this.input.removeClass('ui-state-disabled').removeAttr('disabled');
}

PrimeFaces.widget.AutoComplete.prototype.close = function() {
    this.hide();
}

PrimeFaces.widget.AutoComplete.prototype.deactivate = function() {
    this.active = false;
}

PrimeFaces.widget.AutoComplete.prototype.activate = function() {
    this.active = true;
}

PrimeFaces.widget.AutoComplete.prototype.alignPanel = function() {
    var offset = this.input.offset();
    
    this.panel.css({
       'top':  offset.top + this.input.outerHeight(),
       'left': offset.left,
       'width': this.input.innerWidth() + 'px'
    });
}