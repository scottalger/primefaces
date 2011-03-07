/**
 * PrimeFaces Panel Widget
 */
PrimeFaces.widget.Panel = function(id, cfg) {
    this.id = id;
    this.cfg = cfg;
    this.jqId = PrimeFaces.escapeClientId(id);

    if(this.cfg.toggleable) {
        this.toggler = $(this.jqId + '_toggler');
        this.toggleStateHolder = $(this.jqId + '_collapsed');
        this.content = $(this.jqId + '_content');

        this.setupToggleTrigger();
    }

    if(this.cfg.closable) {
        this.visibleStateHolder = $(this.jqId + "_visible");

        this.setupCloseTrigger();
    }

    if(this.cfg.hasMenu) {
        this.visibleStateHolder = $(this.jqId + "_visible");

        this.setupMenuTrigger();
    }
	
    if(!this.cfg.visible) {
        $(this.jqId).css('display','none');
    }
}

PrimeFaces.widget.Panel.prototype.toggle = function() {
    if(this.cfg.collapsed) {
        this.toggler.removeClass('ui-icon-plusthick').addClass('ui-icon-minusthick');
        this.cfg.collapsed = false;
        this.toggleStateHolder.val(false);
    }
    else {
        this.toggler.removeClass('ui-icon-minusthick').addClass('ui-icon-plusthick');
        this.cfg.collapsed = true;
        this.toggleStateHolder.val(true);
    }
	
    var _self = this;

    this.content.slideToggle(this.cfg.toggleSpeed,
        function() {
            if(_self.cfg.ajaxToggle) {
                var options = {
                    source: _self.id,
                    process: _self.id
                };

                if(_self.cfg.onToggleUpdate) {
                   options.update = _self.cfg.onToggleUpdate;
                }
                
                var params = {};
                params[_self.id + "_ajaxToggle"] = true;
                params[_self.id + "_collapsed"] = _self.cfg.collapsed;

                options.params = params;
				
                PrimeFaces.ajax.AjaxRequest(options);
            }
        });
}

PrimeFaces.widget.Panel.prototype.close = function() {
    this.visibleStateHolder.val(false);

    if(this.cfg.onCloseStart) {
        this.cfg.onCloseStart.call();
    }

    var _self = this;

    if(this.cfg.ajaxClose) {
        $(this.jqId).fadeOut(this.cfg.closeSpeed,
            function() {
                var options = {
                    source: _self.id,
                    process: _self.id
                };

                if(_self.cfg.onCloseUpdate) {
                   options.update = _self.cfg.onCloseUpdate;
                }

                if(_self.cfg.onCloseComplete) {
                    options.oncomplete = function() {
                        _self.cfg.onCloseComplete.call();
                    };
                }

                var params = {};
                params[_self.id + "_ajaxClose"] = true;

                options.params = params;

                PrimeFaces.ajax.AjaxRequest(options);
                
            });
    } else {

        $(this.jqId).fadeOut(this.cfg.closeSpeed, function() {
            if(_self.cfg.onCloseComplete) {
                _self.cfg.onCloseComplete.call();
            }
        });
    }
}

PrimeFaces.widget.Panel.prototype.show = function() {
    $(this.jqId).fadeIn(this.cfg.closeSpeed);
	
    this.visibleStateHolder.val(true);
}

PrimeFaces.widget.Panel.prototype.setupToggleTrigger = function() {
    var _self = this,
    trigger = this.toggler.parent();

    this.setupTriggerVisuals(trigger);
    
    trigger.click(function() {_self.toggle();});
}

PrimeFaces.widget.Panel.prototype.setupCloseTrigger = function() {
    var _self = this,
    trigger = $(this.jqId + '_closer').parent();

    this.setupTriggerVisuals(trigger);
    
    trigger.click(function() {_self.close();});
}

PrimeFaces.widget.Panel.prototype.setupMenuTrigger = function() {
    var trigger = $(this.jqId + '_menu').parent();

    this.setupTriggerVisuals(trigger);
}

PrimeFaces.widget.Panel.prototype.setupTriggerVisuals = function(trigger) {
    trigger.mouseover(function() {$(this).addClass('ui-state-hover');})
            .mouseout(function() {$(this).removeClass('ui-state-hover');});
}