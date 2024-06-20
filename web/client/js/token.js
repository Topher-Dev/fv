'use strict';
    /**
     * A singleton object for managing users token 
     * @return {Object}
     */

    var token = (function() {

        const store_location = "token"

        function _token(){
            return store.getItem(store_location) || null ;
        }

        /**
         * Retrieve the raw token
         * @return {String} Token 
         */
        function get() {
            return _token();
        }

        /**
         * Validate then store token as private variable within this instance & in local storage
         * @param {String}  Token The value to store
         * @return {Boolean}  
         */
        function set(v) {
            return store.setItem(store_location, v);
        }

        /**
         * Destory the instances token & locally stored value
         * @return {Boolean}
         */
        function destroy() {
            return  _token() && store.removeItem(store_location);
        }

        /**
         * Parse JTWs embedded values
         * @param {String} JSON Formatted Json web token
         * @return {Object|False}
         */
        function parse(v = null) {
            try {
                const base64Url = v || _token().split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const json_payload = decodeURIComponent(atob(base64).split('').map(c => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                //TODO only return if admin

                return JSON.parse(json_payload);
            } catch {
                return false;
            };
        }

        /**
         * Print to console the users embedded JWT information
         */
        function pretty(){

            const { expires, id, ip } = this.parse();

            console.log(`
                belongs to: ${id}
                from: ${ip} @ ${expires.timezone}
                expires at: ${expires.date}
                value: ${this.get().substring(0,50) + "..."}
            `);
        }

        //token
        return {
            set,
            get,
            destroy,
            parse,
            pretty
        };
        
    })();