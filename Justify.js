class Justify {
    justifyLocalStorage = '__justify_noty_message'
    href_default = 'javascript:void(0)'
    errorClass = {
        'field': 'is-invalid',
        'span': 'invalid-feedback',
        'attr': 'role="alert"'
    }

    constructor(options = null) {
        if (typeof window !== 'undefined') {
            // Running in a browser environment
            window._jtf = this;
        } else if (typeof global !== 'undefined') {
            // Running in a Node.js environment
            global._jtf = this;
        }

        if (typeof options !== 'undefined' && options !== null) {
            this.debug = options.debug ? options.debug : false;//set where to show error in notificatio or under fields
            this.showBorderError = (options.showBorderError !== false); // set this to true to show border in red color
            this.underfieldError = (options.underfieldError !== false); //set it true if you want to show error under field
            this.justifyError = options.justifyError ? options.justifyError : false;//set this to true if you want to show error in notify
            this.pleaseContactToAdmin = options.defaultErrorMessage ? options.defaultErrorMessage : 'Please contact to admin for more report'; //default error message
            this.splitMessage = options.splitMessage ? options.splitMessage : false;
            this.loaderClass = options.loaderClass ? options.loaderClass : 'loader-div';
            this.csrfTokenUrl = options.csrfTokenUrl ? options.csrfTokenUrl : null;
            this.csrfToken = options.csrfToken ? options.csrfToken : null;
            this.csrfTokenName = options.csrfTokenName ? options.csrfTokenName : null;
            this.refreshCsrfToken = options.refreshCsrfToken ? options.refreshCsrfToken : false;
            this.customJustify = options.customJustify ? options.customJustify : null;
            this.ajaxTimeout = options.ajaxTimeout ? options.ajaxTimeout : 0;
        }
        _jtf.rewriteCsrfToken();
        _jtf.init()
    }

    init() {
        //define all events here
        $(document).on('click', 'a', _jtf.dataMethodPost);
        $(document).on('submit', '.ajaxForm', _jtf.submitFormWithValidate);
        $(document).on('change', 'input,textarea,select', _jtf.removeError);
        _jtf.addMetaTag();
        _jtf.justifyNotyMessage();
        _jtf.checkHrefHash();
    }

    generateUniqueId() {
        return Math.floor(Math.random() * 26) + Date.now()
    }

    xhrStatusCodeMessages() {
        return {
            404: function (xhr) {
                _jtf.notify('error', '404')
                return false
            }
        }
    }

    addMetaTag() {
        if (!_jtf.csrfToken) {
            _jtf.rewriteCsrfToken();
        }
    }

    checkHrefHash() {
        var getHref = $(document).find('a');
        getHref.each(function (i, e) {
            let href = $.trim($(e).attr('href'))
            if ((href === '#') || (href === 'undefined') || (href === undefined) || (href === '')) {
                $(e).attr('href', _jtf.href_default);
            }
        });
    }

    dataMethodPost(e) {
        var getMethod = $(this).data('method');
        var getClass = $(this).data('class');
        var href = $(this).attr('href');

        if ((href === '#') || (href === 'undefined') || (href === undefined) || (href === '') || (href === _jtf.href_default) || (href.indexOf(':void') !== -1)) {
            return false;
        }

        if (getMethod.toLowerCase() !== 'post') {
            return true;
        } else {
            e.preventDefault();
            if (_jtf.uniqueId) {
                $(document).find('#' + _jtf.uniqueId).remove();
            }
            _jtf.uniqueId = _jtf.generateUniqueId()
            var getConfirmMessage = $(this).data('confirm-message');
            if (getConfirmMessage && typeof getConfirmMessage != 'undefined') {
                if (!confirm(getConfirmMessage)) {
                    return false;
                }
            }

            _jtf.loader()
            let htmlForm = "<form action='" + $(this).attr('href') + "' method='" + getMethod + "' id='" + _jtf.uniqueId + "' class='" + getClass + "'><input type='hidden' name='" + _jtf.csrfTokenName + "' value='" + _jtf.csrfToken + "'></form>";
            $(this).parent().append(htmlForm);
            let dataObject = $(this).data()
            let objLength = Object.keys(dataObject).length
            $.each(dataObject, function (name, value) {
                objLength--
                if ($.inArray(name, ['method', 'class']) === -1) {
                    $(document).find('#' + _jtf.uniqueId).append("<input type='hidden' name='" + name + "' value='" + value + "'>")
                }
                if (objLength <= 0) {
                    $("#" + _jtf.uniqueId).submit();
                }
            })
        }
    }

    submitFormWithValidate(e) {
        e.preventDefault();
        var form = $(this);
        (_jtf.csrfToken) ? form.find('input[name="' + _jtf.csrfTokenName + '"]').remove() : '';
        _jtf.loader()
        form.find('span.' + _jtf.errorClass.span).remove();
        form.find('input').removeClass(_jtf.errorClass.field);
        form.find('select').removeClass(_jtf.errorClass.field);
        form.find('textarea').removeClass(_jtf.errorClass.field);
        var method = ((typeof form.attr('method') != 'undefined')) ? form.attr('method') : 'get';
        var url = form.attr('action');
        //clean the name
        form.find('input,select,textarea').each(function () {
            if ($(this).attr('name') && $(this).attr('name') !== undefined) {
                $(this).attr('name', $(this).attr('name').replace(/'/g, ''));
                $(this).attr('name', $(this).attr('name').replace(/"/g, ''));
            }
        });
        var data = new FormData(this);
        if (method.toLowerCase() !== 'post') {
            form.removeClass('ajaxForm');
            form.submit();
        } else {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': _jtf.csrfToken,
                    'X-CSRFTOKEN': _jtf.csrfToken,
                },
                'contentType': false,
                'processData': false,
                'timeout': _jtf.ajaxTimeout,
                statusCode: _jtf.xhrStatusCodeMessages()
            });
            $.post(url, data, function (response) {
                if (response.status === true) {
                    if ((typeof response.url != 'undefined') && ($.trim(response.url) !== '') && (response.url != null)) {
                        if ((typeof response.message != 'undefined') && ($.trim(response.message) !== '') && (response.message != null)) {
                            localStorage.setItem(_jtf.justifyLocalStorage, $.trim(response.message));
                        }
                        window.location.href = response.url;
                        return false;
                    } else {
                        if ((typeof response.message != 'undefined') && ($.trim(response.message) !== '') && (response.message != null)) {
                            _jtf.notify('info', $.trim(response.message));
                        }
                        if ((typeof response.function != 'undefined') && ($.trim(response.function) !== '') && (response.function != null)) {
                            var fnName = $.trim(response.function);
                            if (fnName) {
                                var subFnNames = fnName.split('.')
                                var param = null;
                                if ((typeof response.data != 'undefined') && (response.data !== '')) {
                                    param = response.data;
                                }
                                let allParam = {form, param}
                                _jtf.callDynamicFn(subFnNames, allParam)
                            }
                        }
                    }
                    _jtf.loader(false)
//                    return true;
                } else if (response.status === false) {
                    if ($.trim(response.message) !== '') {
                        _jtf.notify('error', response.message);
                    }
                    _jtf.loader(false)
                } else {
                    if (_jtf.debug) {
                        var debugMessage = response;
                        if (typeof response != 'string') {
                            debugMessage = JSON.stringify(response)
                        }
                        _jtf.notify('error', debugMessage);
                    } else {
                        _jtf.notify('error', _jtf.pleaseContactToAdmin);
                    }
                }
                _jtf.checkHrefHash();
            }).fail(function (response) {
                _jtf.rewriteCsrfToken();
                if (response.responseJSON && response.responseJSON.errors) {
                    var errors = response.responseJSON.errors;
                    var notifyHtml = '';
                    $.each(errors, function (i, e) {
                        //This is for array fields
                        if (i.includes('.')) {
                            var arrayText = i.split('.');
                            var newString = '';
                            $.each(arrayText, function (j, k) {
                                if (j != 0) {
                                    newString += '[' + k + ']';
                                } else {
                                    newString += k;
                                }
                            });
                            i = newString;
                            newString = '';
                        }
                        //this is for array fields end
                        var errorHtml = '<span class="' + _jtf.errorClass.span + '">' + e[0] + '</span>';
                        (_jtf.splitMessage) ? _jtf.notify('error', e[0]) : '';
                        notifyHtml += e[0] + '</br>';
                        if (_jtf.underfieldError) {
                            form.find('input[name="' + i + '"]').parent().append(errorHtml);
                            form.find('select[name="' + i + '"]').parent().append(errorHtml);
                            form.find('textarea[name="' + i + '"]').parent().append(errorHtml);
                        }
                        if (_jtf.showBorderError) {
                            form.find('input[name="' + i + '"]').addClass(_jtf.errorClass.field);
                            form.find('select[name="' + i + '"]').addClass(_jtf.errorClass.field);
                            form.find('textarea[name="' + i + '"]').addClass(_jtf.errorClass.field);
                        }
                    });
                    //show all column error in notify
                    !_jtf.splitMessage ? _jtf.notify('error', notifyHtml) : '';
                } else if (response.responseJSON && response.responseJSON.message) {
                    //show all db error in notify
                    if (_jtf.debug) {
                        _jtf.notify('error', response.responseJSON.message);
                    } else {
                        _jtf.notify('error', _jtf.pleaseContactToAdmin);
                    }
                } else {
                    _jtf.notify('error', _jtf.pleaseContactToAdmin);
                }
                _jtf.checkHrefHash();
                return false;
            });
        }
    }

    loader(show = true) {
        let selector = $('.' + _jtf.loaderClass);
        if (selector.length) {
            show ? selector.show() : selector.hide()
        }
    }

    callDynamicFn(subFn, param, callable = null) {
        $.each(subFn, function (fnK, fnV) {
            // console.log(typeof fnV);
            if (typeof fnV == 'string') {
                callable = (callable != null) ? callable[fnV] : window[fnV];
            }
            if (fnK + 1 == subFn.length) {
                callable(param)
            }
        });
    }

    justifyNotyMessage() {
        var getMessage = localStorage.getItem(_jtf.justifyLocalStorage);
        if ((typeof getMessage != 'undefined') && ($.trim(getMessage) !== '') && getMessage != null) {
            setTimeout(function () {
                _jtf.notify('info', getMessage);
                localStorage.removeItem(_jtf.justifyLocalStorage);
            }, 1500);
        }
    }

    removeError() {
        if ($(this).hasClass(_jtf.errorClass.field)) {
            $(this).removeClass(_jtf.errorClass.field);
        }
    }

    notify(type, message) {
        _jtf.loader(false)
        type = (type === 'info') ? 'information' : type;
        if (!_jtf.justifyError) {
            return;
        }
        if (!message) {
            return;
        }
        if (_jtf.customJustify && (typeof _jtf.customJustify == 'function')) {
            _jtf.customJustify(type, message);
        }
    }

    rewriteCsrfToken() {
        if (!_jtf.refreshCsrfToken) {
            return;
        }
        if (!_jtf.csrfTokenUrl) {
            return;
        }
        $.get(_jtf.csrfTokenUrl, function (response) {
            if (response.token) {
                _jtf.csrfToken = response.token;
                let selector = $('meta[name="' + _jtf.csrfTokenName + '"]');
                (selector.length) ? selector.attr('content', _jtf.csrfToken) : null;
                $('form').each(function (i, e) {
                    $(e).find('input[name="' + _jtf.csrfTokenName + '"]').val(_jtf.csrfToken);
                })
            }
        }).fail(function () {
            _jtf.notify('error', 'Url Not Found');
        });
    }
}