# JS Form Validator For Frameworks

This library used to validate the form with ajax submit and verify the form data based on backend validation.
It can also be used in other frameworks like django(python), laravel(php) etc.
Simply change function representation (tags) according to the frameworks

# Dependency:
1. JQuery (Required)
2. Noty.js (Optional)
3. Add Csrf Token in header of your html page (Required any 1 of these two);
    - Add meta tag to your header
    ```
	  <meta name="csrf-token-name" content="{{ csrf_token_value() }}">
    ```

    - If you want to refresh your csrf token after every request then create a route with below function that return your csrf token dynamic if any request crash, dump or fail when debugging code
    ```
	public function refreshToken() {
	  session()->regenerate();
	  return response()->json([
	    "message" => 'Token Refreshed',
	    "token" => csrf_token()], 200);
	}
    
    ```

4. After validate the form in your controller use this return function:
    ```
    /**
     * Send return response when Ajax call on form submit
     * 
     * @param boolean   $status    This will be true or false.
     * @param string    $url       This is the page Url where to redirect after form submit successfully.
     * @param string    $message   This is to show message on error.
     * @param array     $data      Just in case if you want to send some data in return.
     * @param array     $function  This function will call in javascript like function(param) (this is your custom function and param will be data you return).
     * @return array    This will return all param detail with array.
     * 
     * */
    public function sendResponse($status, $url = '', $message = '', $data = [], $function = '') {
        return [
            'status' => $status,
            'url' => $url,
            'message' => $message,
            'data' => $data,
            'function' => $function
        ];
    }
    ```
   (Recommended to use upper code in parent class and call a function like following code):
    ```
    return $this->sendResponse($status, $url, $message, $data, $function)
    ```

# Uses:
1. Add justify.js after JQuery to your code.
2. setup library
    ```
    let justify = new Justify({
        underfieldError: false,
        showBorderError: true,
        csrfTokenName: 'csrf-token-name<ex. _token, csrf-token>'
        csrfToken: '<your csrf token>'
        justifyError: true,
        customJustify: function(type, message){}
    });
    ```
3. (Optional) User noty or model to display a message or build custom one. Example use customJustify function.
    ```
    let justify = new Justify({
        customJustify: function (type, message) {
            //You can use model to show message,
            //I am using noty to display message as example
            if (typeof noty === 'undefined') {
                return;
            }
            noty({
                text: message,
                theme: 'relax', // or relax
                type: type, // success, error, warning, information, notification
                maxVisible: 10,
                timeout: 4000,
                closeWith: ['click'],
                animation: {
                    open: {height: 'toggle'},
                    close: {height: 'toggle'},
                    easing: 'swing',
                    speed: 500 // opening & closing animation speed
                },
                progressBar: true
            });
        }
    });
    ```
3. Add class ```ajaxForm``` to form tag.
3. done.

# Additional Feature:
### Use Href tag ```<a href="">``` as a POST
1. Set attribute for post request
        
        data-method="post"

2. Ask Confirm before process.
        
        data-confirm-message

3. For Ajax submit
        
        data-class="ajaxForm"
        
### Display session messages
    <?php
    $infoMessage = request()->session()->get('info');
    ?>
    <script>
        setTimeout(function () {
            var message = '<?= $infoMessage; ?>';
            let justify = new Justify();
            justify.notify('info', message);
        }, 500)
    </script>

### Full Example

    <a href="yourUrl" data-confirm-message="enter your message here" data-method="post" data-class="ajaxForm">Click me</a>

# Advantage
1. It can also validate form array values.
2. Validate over href tag.
3. No custom js validation or html validation required, it will direct validate from backend frameworks default validator.
4. If you leave ```href``` empty in a tag it will add ```javascript:void(0)``` to prevent unwanted click.

# Disadvantages
1. <strike>It cannot Submit file if there is file input in the form, you can add file name just like any input field. It will only send file name.</strike>
2. Not it can also upload file 

# Plugin Options:

```
   Param                               Default                             Description
   
   debug                               false                                   As a developer for testing purpose it will return database error and any other error that occur when submit the form.
   showBorderError                     true                                    It will show error if validation fail on any input field.
   underfieldError                     true                                    It will show error under the input field in the span tag
   justifyError                        false                                   This will show a noty popup when if any error occur
   defaultErrorMessage                 'Please contact admin for more info'    If debug is false and site is in development but still some error occur then it will show the default message
   splitMessage                        false                                   If you want to show all message in different different noty then you can set this to true and increase max number of noty from one to higher number.
   loaderClass                         'loader-div'                            When a form is validated by ajax it will take some time this is not good for front end user to wait so if you already have a loader added in your main layout then you can define your own here so the loder will show every time it check the form validation and loader will automatic hide when ajax is complete.
   csrfToken                           required                                If you already added the function from point 4.2 to refresh the token you can define the route here.
   csrfTokenName                       required                                The name of csrf toke field for ex. _token, csrf-token. can be found in framework documentation
   csrfTokenUrl                        null                                    If you already added the function from point 4.2 to refresh the token you can define the route here.
   refreshCsrfToken                    false                                   If you want to refresh csrf token on every fail ajax.
   customJustify                       function                                This is a custom notify callback function, It will call if any error or message found, it will take 2 param one for message type and second for message like in the example above.
   ajaxTimeout                         0                                       Set the timeout for ajax to run, by default it is 0;
```
