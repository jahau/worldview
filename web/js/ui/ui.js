import 'jquery-ui-bundle/jquery-ui';
import loadingIndicator from './indicator';

export default (function(self) {
  // Export other ui methods
  self.indicator = loadingIndicator;
  /**
   * General error handler.
   *
   * Displays a dialog box with the error message. If an exception object
   * is passed in, its contents will be printed to the console.
   *
   * @method error
   * @static
   *
   * @param {Exception} cause The exception object that caused the error
   */
  self.error = function() {
    console.error.apply(console, arguments);

    self.notify(
      "<div class='error-header'>" +
        "<i class='error-icon fas fa-exclamation-triangle fa-3x'></i>" +
        'An unexpected error has occurred' +
        '</div>' +
        "<div class='error-body'>Please reload the page and try " +
        'again. If you continue to have problems, contact us at ' +
        "<a href='mailto:@MAIL@'>" +
        '@MAIL@</a>' +
        '</div>',
      'Error'
    );
  };

  /**
   * Displays a message to the end user in a dialog box.
   *
   * @method notify
   * @static
   *
   * @param {string} message The message to display to the user.
   *
   * @param [title="Notice"] {string} Title for the dialog box.
   */
  self.notify = function(message, title, width, callback) {
    var $dialog = self.getDialog();
    title = title || 'Notice';
    width = width || 300;
    $dialog
      .html(message)
      .dialog({
        title: title,
        width: width,
        minHeight: 1,
        height: 'auto',
        show: {
          effect: 'fade',
          duration: 400
        },
        hide: {
          effect: 'fade',
          duration: 200
        },
        closeText: ''
      })
      .on('dialogclose', function() {
        $(this).off('dialogclose');
        if (callback) {
          callback();
        }
      });
  };

  self.alert = function(body, title, size, glyph, glyphType, closeFn) {
    var $message = $('<span/>', { class: 'notify-message' });
    glyphType = glyphType || 'fa';
    var $icon = $('<i/>', {
      class: glyphType + ' fa-' + glyph + ' fa-1x',
      title: title
    });
    var $messageWrapper = $('<div/>')
      .click(function() {
        self.notify(body, title, size);
      })
      .append($icon)
      .append($message);
    var $close = $('<i/>', { class: 'fa fa-times fa-1x' }).click(closeFn);
    var $alert = $('<div/>')
      .append($close)
      .append($messageWrapper)
      .dialog({
        autoOpen: false,
        resizable: false,
        height: 40,
        width: 420,
        draggable: false,
        show: {
          effect: 'fade',
          duration: 400
        },
        hide: {
          effect: 'fade',
          duration: 200
        },
        dialogClass: 'no-titlebar notify-alert',
        closeText: ''
      });
    $message.empty().append(title);
    return $alert;
  };

  var getComponent = function(marker) {
    var $element = $('<div></div>').addClass(marker);
    $('body').append($element);
    return $element;
  };

  var closeComponent = function(marker, fnClose) {
    var selector = '.' + marker;
    var $element = $(selector);
    if ($element.length !== 0) {
      fnClose($element);
    }
  };

  var closeDialog = function($element) {
    if ($element.length !== 0) {
      if ($element.dialog) {
        $element.dialog('close');
      }
      $element.remove();
    }
  };

  var closeMenu = function($element) {
    if ($element.length !== 0) {
      $element.remove();
    }
  };

  self.close = function() {
    closeComponent('wv-dialog', closeDialog);
    closeComponent('wv-menu', closeMenu);
  };

  self.getDialog = function(marker) {
    self.close(marker);
    return getComponent(marker || 'wv-dialog', closeDialog);
  };

  return self;
})({});
