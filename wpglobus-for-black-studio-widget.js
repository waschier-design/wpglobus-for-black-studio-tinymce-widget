/*jslint browser: true*/
/*global jQuery, console, WPGlobusCore, WPGlobusCoreData, WPGlobusBSWidget*/
(function($) {
	"use strict";
	if ( typeof WPGlobusBSWidget == 'undefined' ) {
		return;	
	}
	
	var api = {	
		option : {
			language: WPGlobusCoreData.default_language,
			content: '',
			activeClass: 'mce-active',
			button_separator: WPGlobusBSWidget.data.button_separator,
			text_separator: WPGlobusBSWidget.data.text_separator,
			icon: WPGlobusBSWidget.data.icon,
			button: WPGlobusBSWidget.data.button,
			button_class: WPGlobusBSWidget.data.button_class,
			button_classes: WPGlobusBSWidget.data.button_classes
		},
		language: {},
		content: {},
		ajaxActionId: null,
		init: function(args) {
			api.option = $.extend( api.option, args );
			api.addButtons();
			api.addListeners();
			if ( 'tinymce' != getUserSetting('editor') ) {
				setUserSetting('editor','tinymce');
			}
		},
		saveContent: function( editor, language ) {
			var c, id;
			if ( typeof editor == 'object' ) {
				c = editor.getContent().replace(/<p>\s*<\/p>/g, '' ); // remove empty p
				id = editor.id;
			} else {
				// string
				id = editor;	
				c = $('#'+id).val();
			}	
			api.content[id] = WPGlobusCore.getString( api.content[id], c, language );
		},
		getTranslation: function( editor, language ) {
			return WPGlobusCore.getTranslations( api.content[editor.id] )[language];	
		},
		removeClass: function( id ) {
			$('.mce-'+api.option.button_class+id).removeClass( api.option.activeClass );
		},
		fixDialogStartIcon: function( id ) {
			var p = $('#'+id).parents('.widget').attr('id');
			if ( typeof p != 'undefined' ) {
				$('#'+p+' .wpglobus_dialog_start.wpglobus_dialog_icon').css('margin-right','20px');
			}	
		},
		addAjaxListener: function( id ) {
			$(document).ajaxComplete(function(event, jqxhr, settings){
				if ( -1 != settings.data.indexOf( 'action=save-widget') ) {
					if ( -1 != settings.data.indexOf( 'delete_widget=1' ) ) {
						// deleted widget
					} else {
						// update or added new widget
						// @todo make fixDialogStartIcon for new widget
						if ( api.ajaxActionId != null ) {
							window.switchEditors.go( api.ajaxActionId, 'tmce' );
							api.fixDialogStartIcon(api.ajaxActionId);
							api.ajaxActionId = null;
						}	
					}	
				}	
			});			
		},	
		addEditorListener: function( id ) {
			var p = $('#'+id).parents('.widget').attr('id');
			if ( typeof p != 'undefined' ) {
				$('#'+p+' .widget-control-save').on('click',function(ev){
					ev.preventDefault();
					if ( tinymce.get(id) == null || tinymce.get(id).isHidden() ) {
						// html mode
						$('#'+id).val( api.content[id] );
					} else {						
						tinymce.get(id).setContent( api.content[id] );
						tinymce.triggerSave();
					}	
					api.ajaxActionId = id;
					if ( 'tinymce' != getUserSetting('editor') ) {
						setUserSetting('editor','tinymce');
					}
				});
			}
		},	
		addListeners: function() {
			api.addAjaxListener();
			$(document).on('click','.widget-title, .widget-title-action',function(ev){
				ev.preventDefault();
				var p = $(this).parents('.widget').attr('id');
				window.switchEditors.go( $('#'+p).find('.wp-editor-area').attr('id'), 'tmce' );
			});		
		},	
		addButtons: function() {
			tinymce.PluginManager.add(api.option.button_separator, function( editor, url ) {
				editor.addButton(api.option.button_separator, {
					text: api.option.text_separator,
					icon: api.option.icon
				});			
			});
			$.each( WPGlobusCoreData.enabled_languages, function(i,language) {	
				tinymce.PluginManager.add(api.option.button+language, function( editor, url ) {
					var active_class = '';
					// ex. widget-black-studio-tinymce-3-text
					if ( editor.id.indexOf('widget-black-studio-') >= 0 ) {
						if ( language == WPGlobusCoreData.default_language ) {
							api.fixDialogStartIcon(editor.id);
							api.addEditorListener(editor.id);
							api.content[editor.id]  = $('#'+editor.id).text();
							api.language[editor.id] = api.option.language;
							$('#'+editor.id).val( api.getTranslation(editor,language) );
							
							active_class = ' active';
							editor.on('blur', function(event,l){
								api.saveContent( editor, api.language[editor.id] );
							});
							$(document).on('change','#'+editor.id, function(event){
								var id = $(this).attr('id');
								if ( tinymce.get(id).isHidden() ) {
									api.saveContent( id, api.language[id] );
								}
							});
						}	
					}	

					editor.addButton(api.option.button+language, {
						text: WPGlobusCoreData.en_language_name[language],
						icon: false,
						tooltip: 'Select '+WPGlobusCoreData.en_language_name[language]+' language',
						value: language,
						classes: api.option.button_classes + active_class + ' ' + api.option.button_class+language + ' ' + api.option.button_class+editor.id,
						onclick: function() {
							var t = $( this ),
								id = t[0]['_id'],
								l = WPGlobusCoreData.default_language;
							
							if ( typeof t[0]['_value'] != 'undefined' ) {
								l = t[0]['_value'];
							} else if ( typeof t[0].settings.value != 'undefined' ) {
								l = t[0].settings.value;
							} else {
								console.log('Language value not defined. It was set to default.');	
							}
							
							api.removeClass( editor.id );
							$('#'+id).addClass( api.option.activeClass );
							api.saveContent( editor, api.language[editor.id] );
							api.language[editor.id] = l;
							editor.setContent( api.getTranslation( editor, api.language[editor.id] ) );
						}	
					});
				});	
				
			});

		}	
	
	}
	
	WPGlobusBSWidget = $.extend({}, WPGlobusBSWidget, api);
	WPGlobusBSWidget.init();
	
})(jQuery);