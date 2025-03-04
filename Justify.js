class Justify {
    justifyLocalStorage = '__jtf_notification_message'
    href_default = 'javascript:void(0)'
    defaultErrorMessage = 'Please contact to admin for more report'
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

        this.debug = options && typeof options.debug !== "undefined" ? options.debug : false
        this.showBorderError = !(options && options.showBorderError === false)
        this.underfieldError = !!(options && options.underfieldError === true)
        this.justifyError = !!(options && options.justifyError === true)
        this.errorField = !(options && options.errorField === false)
        this.splitMessage = !!(options && options.splitMessage === true)
        this.refreshCsrfToken = !!(options && options.refreshCsrfToken === true)
        this.pleaseContactToAdmin = options && options.defaultErrorMessage ? options.defaultErrorMessage : this.defaultErrorMessage; //default error message
        this.loaderClass = options && options.loaderClass ? options.loaderClass : 'loader-div';
        this.csrfTokenUrl = options && options.csrfTokenUrl ? options.csrfTokenUrl : null;
        this.csrfToken = options && options.csrfToken ? options.csrfToken : null;
        this.csrfTokenName = options && options.csrfTokenName ? options.csrfTokenName : null;
        this.customJustify = options && options.customJustify ? options.customJustify : null;
        this.ajaxTimeout = options && options.ajaxTimeout ? options.ajaxTimeout : 0;

        _jtf.rewriteCsrfToken();
        _jtf.init()
    }

    init() {
        //define all events here
        $(document).on('click', 'a', _jtf.dataMethodPost);
        $(document).on('submit', '.ajaxForm', _jtf.submitAjax);
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
        let getHref = $(document).find('a');
        getHref.each(function (i, e) {
            let href = $.trim($(e).attr('href'))
            if ((href === '#') || (href === 'undefined') || (href === undefined) || (href === '')) {
                $(e).attr('href', _jtf.href_default);
            }
        });
    }

    dataMethodPost(e) {
        let getMethod = $(this).data('method') ?? 'get';
        let getClass = $(this).data('class');
        let href = $(this).attr('href');

        if ((href === '#') || (href === 'undefined') || (href === undefined) || (href === '') || (href === _jtf.href_default) || (href.indexOf(':void') !== -1)) {
            return false;
        }

        if (getMethod.toLowerCase() === 'get' && getClass !== 'ajaxForm') {
            return true;
        } else {
            e.preventDefault();
            if (_jtf.uniqueId) {
                $(document).find('#' + _jtf.uniqueId).remove();
            }
            _jtf.uniqueId = _jtf.generateUniqueId()
            let getConfirmMessage = $(this).data('confirm-message');
            if (getConfirmMessage && typeof getConfirmMessage != 'undefined') {
                if (!confirm(getConfirmMessage)) {
                    return false;
                }
            }

            _jtf.loader()
            let htmlForm = "<form action='" + href + "' method='" + getMethod + "' id='" + _jtf.uniqueId + "' class='" + getClass + "'><input type='hidden' name='" + _jtf.csrfTokenName + "' value='" + _jtf.csrfToken + "'></form>";
            $(this).parent().append(htmlForm);
            $(document).find('#' + _jtf.uniqueId).css({position: 'absolute', display: 'none'})
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

    successResponse(form, response) {
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
                    let fnName = $.trim(response.function);
                    if (fnName) {
                        let subFnNames = fnName.split('.')
                        let param = null;
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
                let debugMessage = response;
                if (typeof response != 'string') {
                    debugMessage = JSON.stringify(response)
                }
                _jtf.notify('error', debugMessage);
            } else {
                _jtf.notify('error', _jtf.pleaseContactToAdmin);
            }
        }
        _jtf.checkHrefHash();
    }

    failedResponse(form, xhr) {
        _jtf.rewriteCsrfToken();
        if (xhr.responseJSON && xhr.responseJSON.errors) {
            let errors = xhr.responseJSON.errors;
            let notifyHtml = '';
            $.each(errors, function (i, e) {
                //This is for array fields
                if (i.includes('.')) {
                    let arrayText = i.split('.');
                    let newString = '';
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
                let errorHtml = '<span class="' + _jtf.errorClass.span + '">' + e[0] + '</span>';
                let splitMessage = e[0];
                if (_jtf.errorField) {
                    let errorField = i.replace('_',' ').replace('-',' ')
                    notifyHtml += errorField + ': ';
                    splitMessage = errorField + ': ' + e[0];
                }
                (_jtf.splitMessage) ? _jtf.notify('error', splitMessage) : '';
                notifyHtml += e[0] + '</br>';
                if (_jtf.underfieldError) {
                    form.find('input[name="' + i + '"]').parent().append(errorHtml);
                    form.find('select[name="' + i + '"]').parent().append(errorHtml);
                    form.find('select[name="' + i + '[]"]').parent().append(errorHtml);
                    form.find('textarea[name="' + i + '"]').parent().append(errorHtml);
                }
                if (_jtf.showBorderError) {
                    form.find('input[name="' + i + '"]').addClass(_jtf.errorClass.field);
                    form.find('select[name="' + i + '"]').addClass(_jtf.errorClass.field);
                    form.find('select[name="' + i + '[]"]').addClass(_jtf.errorClass.field);
                    form.find('textarea[name="' + i + '"]').addClass(_jtf.errorClass.field);
                }
            });
            //show all column error in notify
            !_jtf.splitMessage ? _jtf.notify('error', notifyHtml) : '';
        } else if (xhr.responseJSON && xhr.responseJSON.message) {
            //show message if defined
            _jtf.notify('error', xhr.responseJSON.message);
        } else if (xhr.responseJSON) {
            //show all db error in notify
            if (_jtf.debug) {
                _jtf.notify('error', xhr.statusText);
            } else {
                _jtf.notify('error', _jtf.pleaseContactToAdmin);
            }
        } else {
            _jtf.notify('error', _jtf.pleaseContactToAdmin);
        }
        _jtf.checkHrefHash();
        return false;
    }

    submitAjax(e) {
        e.preventDefault();
        let form = $(this);
        (_jtf.csrfToken) ? form.find('input[name="' + _jtf.csrfTokenName + '"]').remove() : '';
        _jtf.loader()
        form.find('span.' + _jtf.errorClass.span).remove();
        form.find('input').removeClass(_jtf.errorClass.field);
        form.find('select').removeClass(_jtf.errorClass.field);
        form.find('textarea').removeClass(_jtf.errorClass.field);
        let method = ((typeof form.attr('method') != 'undefined')) ? form.attr('method') : 'get';
        let url = form.attr('action');
        //clean the name
        form.find('input,select,textarea').each(function () {
            if ($(this).attr('name') && $(this).attr('name') !== undefined) {
                $(this).attr('name', $(this).attr('name').replace(/'/g, ''));
                $(this).attr('name', $(this).attr('name').replace(/"/g, ''));
            }
        });
        let data = new FormData(this);
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

        $.ajax({
            url: url,
            method: method.toUpperCase(),
            data: data,
            success: function (response) {
                _jtf.successResponse(form, response)
            },
            error: function (xhr) {
                _jtf.failedResponse(form, xhr)
            }
        })
    }

    loader(show = true) {
        let selector = $('.' + _jtf.loaderClass);
        if (selector.length) {
            show ? selector.show() : selector.hide()
        }
    }

    callDynamicFn(subFn, param, callable = null) {
        $.each(subFn, function (fnK, fnV) {
            if (typeof fnV == 'string') {
                callable = (callable != null) ? callable[fnV] : window[fnV];
            }
            if (fnK + 1 == subFn.length) {
                callable(param)
            }
        });
    }

    justifyNotyMessage() {
        let getMessage = localStorage.getItem(_jtf.justifyLocalStorage);
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
        if (!_jtf.customJustify) {
            alert(type + ': ' + message)
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