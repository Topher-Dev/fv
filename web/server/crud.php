<?php

include_once $_SERVER["APP_GIT_ROOT"]."/web/server/database.php";

/*
* This class is used to create, read, update and delete data from the database
*/
class Crud {


    private $props;

    public $response = [
        "type" => null,
        "data" => [],
    ];

    /*
    * 
    * @param $methods array of methods that are allowed to be called
    */
    function __construct($methods, $table, $fields, $keys, $db){

        $this->db = $db;

        //The methods that are allowed to be called
        $this->qualified_methods = $methods;

        //Any raw data that is extracted by the model to describe the record
        $this->fields = $fields;

        //The keys that are used to access the record
        $this->record_access_keys = $keys;

        //The table the record is stored in
        $this->table = $table;

        //Store the relations to the record
        $this->relations = null;

    }

    //Retrieve a field by key
    public function get_field($key){
        //check if $field exists
        if (isset($this->fields[$key])) {
            return $this->fields[$key];
        } else {
            return null;
        }
    }

    //set a field by key
    public function set_field($key, $value){
        //check if $field exists
        if (isset($this->fields[$key])) {
            $this->fields[$key] = $value;
            return true;
        } else {
            return false;
        }
    }

    /*
    * Adds data to the data array
    */
    public function create_one(){

        //only run if the method is allowed
        if (!isset($this->qualified_methods["create_one"])) {
            error_log("Method not allowed");
            return false;
        }

        $api_conditions = $this->qualified_methods["create_one"];
        
        //filter our any values that have a null value
        $create_data = array_filter($this->fields, function($value) { return $value !== null; });
        $id = $this->db->insert_one($this->table, $create_data, false);

        if (!$id){
            return false;
        }

        $this->set_field("id", $id);
        $this->record_access_keys[] = "id";

        $this->response["type"] = $api_conditions["response"]["type"];
        //TODO move
        $this->response["data"] = [ "id" => $id];   

        return true;

    }

    /*
    * Reads a single record from the database
    */
    public function read_one(array $options = []) : bool
    {

        //only run if the method is allowed
        if (!isset($this->qualified_methods["read_one"])) {
            error_log("Method not allowed");
            return false;
        }

        $api_conditions = $this->qualified_methods["read_one"];

        //get the key + value for the first record access key
        $key = $this->record_access_keys[0];
        $value = $this->get_field($key);

        //if we have $options then we need to make some changes
        if (count($options) > 0) {
            //if view is set to true update table name to the view name
            if (isset($options["view"])) {
                
                //Remove the plural from table name
                $key = $this->table . "_" . $key;
                $this->table = $options["view"];
            }
        }

        $one = $this->db->select_one($this->table, $key, $value);

        //if we have a valid record then set the fields
        if ($one) {
            $this->fields = $one;
        } else {
            return false;
        }

        //set the format we want to return the data in
        $this->response["type"] = $api_conditions["response"]["type"];

        //return only the values specified in the response
        foreach ($api_conditions["response"]["required"] as $required_field) {
            $this->response["data"][$required_field] = $one[$required_field];
        }

        return true;

    }

    public function update_one(){

        //only run if the method is allowed
        if (!isset($this->qualified_methods["update_one"])) {
            error_log("Method not allowed");
            return false;
        }

        $api_conditions = $this->qualified_methods["update_one"];
        $key = $this->record_access_keys[0];
 
        //check if id is in the $this->record_access_keys = eg. ["id", "email"]
        if (array_key_exists("id", $this->record_access_keys)) {
            $key = "id";
        }

        $value = $this->get_field($key);
        
        //filter out the fields that have a value=null or are the key="id"
        $update_data = array_filter($this->fields, function($value, $key) { return $value !== null && $key !== "id"; }, ARRAY_FILTER_USE_BOTH);
        $result = $this->db->update_one($this->table, $key, $value, $update_data);

        $this->response["type"] = "boolean";
        
        if ($result){
            error_log("Update successful");
            $this->response["data"] = ["result" => true];
            return true;
        } else {
            error_log("Update failed");
            $this->response["data"] = ["result" => false];
            return false;
        }

    }

    public function delete_one(){

        //only run if the method is allowed
        if (!isset($this->qualified_methods["delete_one"])) {
            error_log("Method not allowed");
            return false;
        }

        $api_conditions = $this->qualified_methods["delete_one"];
        $key = $this->record_access_keys[0];
        $value = $this->get_field($key);

        $result = $this->db->delete_one(
            $this->table,
            $key,
            $value
        );
        
        $this->response["type"] = "boolean";
        
        if ($result){
            error_log("Delete successfully");
            $this->response["data"] = ["result" => true];
            return true;
        } else {
            error_log("Delete failed");
            $this->response["data"] = ["result" => false];
            return false;
        }
    }

    public function read_list(){

        //only run if the method is allowed
        if (!isset($this->qualified_methods["read_list"])) {
            error_log("Method not allowed");
            return false;
        }

        //check if use_view is set in $api_conditions["response"] and is true
        if (isset($this->qualified_methods["read_list"]["response"]["use_view"])) {
            $this->table = $this->qualified_methods["read_list"]["response"]["use_view"];
        }

        $api_conditions = $this->qualified_methods["read_list"];

        //get a count of the query;
        $filter = $api_conditions["response"]["filter_template"]  
            . " " . $api_conditions["response"]["order_by"]
            . " " . $api_conditions["response"]["paginate"];

        $this->response["data"] = $this->db->select_list(
           $this->table,
           $filter,
           $api_conditions["response"]["filter_params"],
           $api_conditions["response"]["required"],
        );

        //reset the response array
        $this->response["count"] = $this->db->count(
            $this->table,
            $api_conditions["response"]["filter_template"],
            $api_conditions["response"]["filter_params"]
        );

        //set the format we want to return the data in
        $this->response["type"] = $api_conditions["response"]["type"];

        return true;

    }

    public function get_relations(){

        if (count($this->record_access_keys) == 0) {
            error_log("No record access keys set");
            return false;
        }

        $key = $this->record_access_keys[0];
        $value = $this->get_field($key);

        $this->relations = $this->db->select_one(
            $this->table."_view",
            $key,
            $value
        );  
    }

    //Encountered an error return some useful information
    public function dump(){
        return [
            "fields" => $this->fields,
            "record_access_keys" => $this->record_access_keys,
            "response" => $this->response,
            "qualified_methods" => $this->qualified_methods,
        ];
    }

    public function response(){
        //create a different response based on the return type json, xml etc
        switch ($this->response["type"]) {
            case 'id':
            case 'json':
            case 'list_of_objects':
            case 'object':
            case 'boolean':
                # code...
                // return $this->response["data"];
                if (isset($this->response["count"])){
                    return [
                        "count" => $this->response["count"],
                        "rows" => $this->response["data"]
                    ];
                }

                return $this->response["data"];
            case 'xml':
                # code...
                return;
            case 'html':
                # code...
                return;
            case 'csv':
                # code...
                return;
            default:
                # code...
                return ["error" => "Model failed to deliver a response"];
        }

    }

}
