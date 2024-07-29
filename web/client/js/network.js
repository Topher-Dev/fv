'use strict';

    /**
     * A list of constants - Services & corresponding Methods used as parameters in combination to make arc API Calls
     * EG. arc.get(AUTH, REGISTER, ...params)
     */
                                            // CRUD
                                            const FORM = "form";
                                            const CHECKLIST = "checklist_relations";

                                            const CREATE_ONE = "create_one";
                                            const READ_ONE = "read_one";
                                            const UPDATE_ONE = "update_one";
                                            const DELETE_ONE = "delete_one";

                                            const CREATE_LIST = "create_list";
                                            const READ_LIST = "read_list";
                                            const UPDATE_LIST = "update_list";
                                            const DELETE_LIST = "delete_list";

    const SYSTEM = "system";                const INITIALIZE = "initialize";
                                            const SERTI_UPLOAD = "serti_upload";

    // Controller                           // Service
    const AUTH = "auth";                    const REGISTER = "register";
                                            const LOGIN = "login";
                                            const LOGOUT = "logout";

    const VEHICLE = "vehicle";
    const VEHICLE_SERTI = "vehicle_serti";

    const ORGANIZATION = "organization";  
    const COMPANY = "company";
    const BRANCH = "branch";
    const DEPARTMENT = "department";
    const PERSON = "person";
    const ROLE = "role";
    const ALERT = "alert";
    const EVENT_TYPE = "event_type";
    const EVENT = "event";
    const UFC_EVENT = "ufc_event";
    const UFC_FIGHT = "ufc_fight";
    const UFC_FIGHTER = "ufc_fighter";


    /**
     * A singleton object for creating & managing arc parameterized & defined network requests 
     * @return {Object}
     */

    var arc = (function() {

        const GET = "GET";
        const POST = "POST";
        const PUT = "PUT";
        const DELETE = "DELETE";

        function loading(state){
            if (state === true){
                hide(".svg-activity");
                show(".svg-loading");
            } else {
                hide(".svg-loading");
                show(".svg-activity");
            }
        }

        /**
         * The core private function for creating an http request
         * @param {String}          Constant GET or POST
         * @param {String}          Endpoint Arc system formatted url
         * @param {FormData|String} Parameters formdata object or uri encoded string parameters
         * @return {Promise}
         */

        async function _jax(getpost, url, parameters = null) {

            try {
                loading(true);
            } catch (error) {
                console.log(error)
            }

            return new Promise((resolve, reject) => {
                let httpRequest;
        
                if (window.XMLHttpRequest) {
                    httpRequest = new XMLHttpRequest();
                    if (httpRequest.overrideMimeType) {
                        httpRequest.overrideMimeType('text/xml');
                    }
                }
        
                if (!httpRequest) {
                    alert('Giving up :( Cannot create an XMLHTTP instance');
                    return reject(new Error('Cannot create an XMLHTTP instance'));
                }
        
                const handleError = () => {
                    app.view.change("error", { request: httpRequest, mode: "server" });
                    //console.log(httpRequest);
                    reject(false);
                };
        
                httpRequest.onload = function () {

                    //TODO
                    try {
                        loading(false);
                    } catch (error) {
                        console.log(error)
                    }

                    if (this.status >= 200 && this.status < 300) {
                        resolve(httpRequest.response);
                    } else {
                        handleError();
                    }
                };
        
                httpRequest.onerror = handleError;
        
                const method = getpost.toUpperCase();
        
                switch (method) {
                    case 'GET':
                        httpRequest.open('GET', url, true);
                        httpRequest.send();
                        break;
                    case 'POST':
                        httpRequest.open('POST', url, true);
                        if (!(parameters instanceof FormData) && is_object(parameters)) {
                            parameters = Object.entries(parameters).map(([key, val]) => `${key}=${encodeURIComponent(val)}`).join('&');
                            httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                        }
                        httpRequest.send(parameters);
                        break;
                    default:
                        reject(new Error('Invalid HTTP method provided.'));
                        break;
                }
            });
        }

        /**
         * A function that creates a url for Arc api calls
         * @param {String}  controller A constant value corresponding to a backend controller class
         * @param {String}  service A constant value corresponding to a backend classes service
         * @param {Object}  parameters key / value paired parameters
         * @return {String}
         */
        function url(controller, service, params = {}){
            const parameters = {
                s: controller,
                m: service,
                token: token.get(),
                ...params
            };
            return "arc.php?" + Object.entries(parameters).map(([key, val]) => `${key}=${encodeURIComponent(val)}`).join('&');
        }

        /**
         * A function that takes the api response and converts the data to indicated format
         * @param {Mixed} response response from api call
         * @param {String} format  the format that the response should be converted to
         * @return {Mixed}
         */
         function parse_response(r, format = "json"){
            switch (format) {
                case "json":

                    if (is_string_json(r)){

                        return JSON.parse(r);

                    } else {
                        //console.log("String not parsed form json", r);
                        Q("main").innerHTML = r;
                        return {
                            status: 99,
                            message: "Badly formatted response, see console for details"
                        }
                    }

                case "html":
                
                    break;
        
                case "xml":
                    
                    break;
                
                case "csv":
                
                    break;
        
                default:
                    return false;
            }
        }


        /**
         * A function that makes an object.
         * @param {String} Service
         * @param {String} Method
         * @param {Object} Parameters
         * @param {String} getpost
         * @return {Mixed}
         */
        async function request(service, method, parameters, getpost) {

            let response_raw;

            if (getpost === POST){
                response_raw = await _jax(POST, url(service, method), parameters);
            } else if (getpost === GET){
                response_raw = await _jax(GET, url(service, method, parameters));
            }

            const response_parsed = parse_response(response_raw);


            const { status } = response_parsed;

            // //handle app level errors, they will arrive with a 1 status code
            // if (status === 1){
            //     const options = {
            //         mode: "server",
            //         request: {
            //             controller: service,
            //             service: method,
            //             parameters,
            //             method: getpost
            //         },
            //         response: response_parsed
            //     }
            //     app.view.change("error", options)
            // }


            if (status === 2) {
                console.log("Status 2, Apache message reply session has expired")
                listeners.CORE(["logout"]).logout(null, "Session has expired");
                throw new Error("Stop execution");
            }

            return response_parsed;
        }

        /**
         * A function that makes a POST request.
         * @param {String} Service
         * @param {String} Method
         * @param {Object} Parameters
         * @return {Mixed}
         */
        async function post(service, method, parameters) {
            return request(service, method, parameters, POST);
        }

        /**
         * A function that makes a GET request.
         * @param {String} Service
         * @param {String} Method
         * @param {Object} Parameters
         * @return {Mixed}
         */
        async function get(service, method, parameters) {
            return request(service, method, parameters, GET);
        }

    
        return {
            post,
            get
        };
        
    })();

    let arc_socket = null;
    let reconnect_interval;
    let reconnect_attempts = 0;
    let reconnect_delay = 20000;
    const max_reconnect_attempts = 10;
    const prepsheet_conflict_queue = [];
    
    function send_arc_ws(message, data = {}) {
        if (arc_socket && arc_socket.readyState === WebSocket.OPEN) {
            arc_socket.send(JSON.stringify({
                token: token.get(),
                message: message,
                data: data
            }));
        } else {
            console.log("Arc socket not ready, unable to send message");
        }
    }
    
    function check_and_reconnect() {
        // console.log(`Checking arc socket connection, reconnect attempts ${reconnect_attempts} of ${max_reconnect_attempts}`);
        if (!token.get()) {
            reconnect_attempts = 0;
            reconnect_delay = 5000;
            return;
        };

        if (!arc_socket || arc_socket.readyState !== WebSocket.OPEN) {
            if (reconnect_attempts < max_reconnect_attempts) {
                connect_arc_ws();
                reconnect_attempts++;
                console.log(`Arc socket reconnect attempt ${reconnect_attempts} of ${max_reconnect_attempts}`);
            } else {
                console.log(`Arc socket unable to reconnect after ${max_reconnect_attempts} attempts`);
                reconnect_attempts = 0;
                reconnect_delay = 5000;
            }
        } else {
            //console.log("Arc socket is connected");
        }
    }

    function connect_arc_ws() {

        //const arc_socket_connection = "wss://salesprep.app:8040";
        let arc_socket_connection;
        
        if (app.runmode === "dev"){
            arc_socket_connection = "ws://localhost:8040";
        } else if (app.runmode === "uat"){
            arc_socket_connection = "wss://uat.salesprep.ca:8040";
        } else if (app.runmode === "prod"){
            arc_socket_connection = "wss://salesprep.app:8040";
        } else {
            console.log("Unknown run mode", app.runmode);
            return;
        }

        arc_socket = new WebSocket(arc_socket_connection);

        // Connection opened
        arc_socket.addEventListener('open', function(event) {
            send_arc_ws("add_credentials", { active_branch_id: Q("#branch-select")?.value });
            reconnect_attempts = 0;
            reconnect_delay = 5000;
        });
    
        // Listen for messages
        arc_socket.addEventListener('message', function (event) {

            const response = JSON.parse(event.data);
            //console.log('Received message:', event.data, response, event);

            if (response.status === 2) {
                console.log("Status 2, wss message reply session has expired")
                listeners.CORE(["logout"]).logout(null, "Session has expired");
                return;
            }

            switch (response.message) {
                case "event_alert":

                    const alert_count = (Number(Q("#alert-notification-count").innerText) || 0) + response.data.length;
                    
                    //get all the ids that have been sent and add them to the pending alerts
                    const pending_alert_ids = response.data.reduce((acc, cur) => {
                        acc[cur.id] = false;
                        return acc;
                    }, {});

                    // //merge them with app.menu.alerts.data.pending_alerts which is an object { id: boolean, id: boolean }
                    app.menu.alerts.data.pending_alerts = { ...app.menu.alerts.data.pending_alerts, ...pending_alert_ids };

                    update_ui_alerts_count(alert_count);

                    //refresh the alerts list

                    //update the selected_li_index to its new position
                    app.menu.alerts.data.selected_li_index = parseInt(app.menu.alerts.data.selected_li_index) + response.data.length;

                    // app.menu.alerts.do("fetch");
                    //console.log(response);

                    //loop through the response.data and extract the code property, then call the corresponding handler
                    response.data.forEach(alert => {
                        //console.log(alert.code, alert.data)
                        const alert_data = JSON.parse(alert.data);
                        switch (alert.code) {

                            case "prepsheet::update":
                                console.log("Prepsheet update alert", alert, app.view.list.prepsheet_manage.component.data?.id, alert_data)
                                //check if the user is currently viewing the prepsheet
                                console.log(app.data.user.id, alert.created_by, app.data.user.id !== alert.created_by)
                                if (app.view.list.prepsheet_manage.component.data?.id === alert_data?.id && app.data.user.id !== alert.created_by){
                                    //Open a modal to inform the user that the prepsheet has been updated and to make a decision

                                    prepsheet_conflict_queue.push(alert_data);

                                    app.modal.open(`<span class="tt--c">${alert_data.user}<span/><span class="text-light"> just made changes! Stock No: ${alert_data.stock_no}</span>`, modal_prepsheet_conflict, { alert }, 'prepsheet-conflict', true);
                                }

                                break;
                            default:
                                break;
                        }
                    });


                

                    
                        



                    break;

                default:
                    break;
            }

        });

        // Connection closed
        arc_socket.addEventListener('close', function (event) {
            if (event.wasClean) {
                console.log(`WebSocket connection closed cleanly, code=${event.code} reason=${event.reason}`);
                return;
            } else {
                console.log('WebSocket connection abruptly closed');
            }

            if (!token.get() && (reconnect_attempts < max_reconnect_attempts)) {
                // connect_arc_ws();
                reconnect_attempts++;
                reconnect_delay += 5000;
            } else {
                reconnect_attempts = 0;
                reconnect_delay = 5000;
            }
        });
    
        // Connection error
        arc_socket.addEventListener('error', function (event) {
            console.log('WebSocket connection error', event);
            switch (event.code) {
                case 1000:
                    console.log('WebSocket connection closed successfully');
                    break;
                case 1001:
                    console.log('WebSocket connection closed due to going away');
                    break;
                case 1002:
                    console.log('WebSocket connection closed due to protocol error');
                    break;
                case 1003:
                    console.log('WebSocket connection closed due to unsupported data');
                    break;
                case 1004:
                    console.log('WebSocket connection closed due to reserved data');
                    break;
                case 1005:
                    console.log('WebSocket connection closed due to no status code');
                    break;
                case 1006:
                    console.log('WebSocket connection closed due to abnormal closure');
                    break;
                case 1007:
                    console.log('WebSocket connection closed due to invalid data');
                    break;
                case 1008:
                    console.log('WebSocket connection closed due to policy violation');
                    break;
                case 1009:
                    console.log('WebSocket connection closed due to message too big');
                    break;
                case 1010:
                    console.log('WebSocket connection closed due to extension negotiation failure');
                    break;
                case 1011:
                    console.log('WebSocket connection closed due to server encountering an unexpected condition');
                    break;
                case 1015:
                    console.log('WebSocket connection closed due to TLS handshake failure');
                    break;
                default:
                    console.log('Unknown WebSocket connection error');
                    break;
            }
        });
    }
    
    //reconnect_interval = setInterval(check_and_reconnect, reconnect_delay);
