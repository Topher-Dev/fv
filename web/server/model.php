<?php

include_once $_SERVER["APP_GIT_ROOT"]."/web/server/crud.php";
/*

*/

class Model {

    public $debug = true;
    public $enforced_filter = null;
    public $locations = ['/web/server/models', '/web/server/models/filters'];

    /*
        The model constructor will take the id of the model and load the json file
        that contains the model's blueprint
        @param $id - the id of the model
    */
    function __construct(string $id, $db){

        $this->id = $id;
        $this->db = $db;

        try {
            $this->memcache = new Memcache;
            $this->memcache->pconnect('localhost', 11211);
        } catch (Exception $e) {
            error_log("Memcache connection failed: " . $e->getMessage());
            $this->memcache = null; // Set to null,
        }

        //validation & html
        $model = $this->get_model();
        lg($model);
        error_log("test");
        $this->table = $model['table'];
        $this->fields = $model['fields'];
        $this->operations = $model['operations'];
        $this->errors = [];
       
	}

    private function get_model() {
        // Create a unique key for the file content in cache
        $cache_key = 'file_content_' . md5($this->id);
    
        // First, try to get the file content from cache
        $cache_content = $this->memcache->get($cache_key);

        if ($cache_content !== false) {
            return $cache_content; // Return the content from cache
        }
  
        // If not in cache, search the directories for the json model and combine with db
        foreach ($this->locations as $dir) {
            $full_path = $_SERVER["APP_GIT_ROOT"] . $dir . '/' . $this->id . '.json';
            error_log($full_path);
            if (file_exists($full_path)) {
                $model_json = file_get_contents($full_path);
                $model_arr = json_decode($model_json, true);
                //get the type from the last directory
                $model_arr['type'] = substr($dir, strrpos($dir, '/') + 1);

                $this->db_enhance_model($model_arr);

                // Store the content in cache for future access
                $this->memcache->set($cache_key, $model_arr, MEMCACHE_COMPRESSED, 3600); // 3600 seconds = 1 hour
                return $model_arr;
            }
        }
        
    
        return false; // Return false if the file is not found
    }

    /**
     * Enhances a given model array with additional field information from the database.
     * This function queries the database to fetch details about each field in the specified table, such as data type, 
     * whether it's unique, nullable, and if it has a default value. It then merges this database information 
     * with the existing model array. It also handles character maximum length for applicable fields.
     *
     * @param array &$model_arr The model array to be enhanced. It should contain at least a 'table' key.
     */
    public function db_enhance_model(&$model_arr) {
        $db = $this->db;
        $table_name = $model_arr['table'];

        $sql = <<<SQL
            SELECT
                c.column_name, 
                REPLACE(c.data_type, ' ', '_') as data_type, 
                c.character_maximum_length,
                CASE
                    WHEN tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY') THEN true
                    ELSE false
                END as is_unique,
                c.is_nullable = 'YES' as is_nullable,
                c.column_default IS NOT NULL as has_default
            FROM information_schema.columns as c
            LEFT JOIN (
                SELECT cc.constraint_name, tc.constraint_type, cc.column_name
                FROM information_schema.constraint_column_usage as cc
                JOIN information_schema.table_constraints as tc
                ON cc.constraint_name = tc.constraint_name
                WHERE tc.table_name = '{$table_name}'
            ) as tc ON c.column_name = tc.column_name
            WHERE c.table_name = '{$table_name}'
    SQL;

        $db_columns = $db->query($sql);

        if (!$db_columns) {
            // Consider handling the error more robustly, e.g., throwing an exception or logging
            return;
        }

        // Loop through and merge database column details with the model array
        foreach ($db_columns as $dc) {
            $dc_name = $dc['column_name'];
            if (isset($model_arr['fields'][$dc_name])) {
                $model_arr['fields'][$dc_name] = array_merge($dc, $model_arr['fields'][$dc_name]);
            } else {
                $model_arr['fields'][$dc_name] = array_merge($dc, [
                    "validation" => null,
                    "html" => null
                ]);
            }
        }

        // Log the enhanced model array; consider a more descriptive message
        lg($model_arr);
    }


    public function enforce_filter($enforced_filter){
        $this->enforced_filter = $enforced_filter;
    }

    public function build_filter($client_data){

        $filter_template = "where ";
        $filter_params = [];

        if($this->enforced_filter){

            //we need to make sure that we have atleast one of the enforced filters params
            $enforced_filter_params = explode(",", $this->enforced_filter);

            foreach($enforced_filter_params as $param){

                //check if the client data has the enforced filter param
                if(isset($client_data[$param])){

                    if($filter_template != "where "){
                        $filter_template .=  "and ";
                    }
                    
                    $filter_template .= "{$param}=:{$param} ";

                    $filter_params[$param] = $client_data[$param];
                }
            }

            if ($filter_template == "where "){
                $this->errors[$param] = "PROP_ERR: missing required filter parameter ({$param}))";
            } else {
                error_log("Enforced filter has been setup");
            }

            return [$filter_template, $filter_params];
        }
        error_log("no enforced filter");
        return [$filter_template, $filter_params];
    }
    /*
    *   The primary  function that uses the models props & tools with json model blueprint to build a CRUD object
    *   The crud object represents the record(s) & the operations that can be performed on it(them)
    ************ Currently being used for single records only
    *   @param $data - the data that will be used to build the object
    */
    public function build(array $client_data){

        $methods = [];
        $sanitized_fields = [];
        $unique_record_access_keys = [];

        //Analyze all the fields in the model and validate any client data against them

        foreach($this->fields as $column => $properties){

            $value;

            //check for the bare minimum required properties
            $required = ["data_type", "is_unique", "is_nullable", "has_default"];
            // lg($properties);
            // lg($column);
            foreach($required as $property){
                if(!isset($properties[$property])){
                    $this->errors[$column] = "PROP_ERR: missing required property ({$property}))";
                    break 2;
                }
            }

            if(!isset($client_data[$column])){
                $sanitized_fields[$column] = null;
                continue;
            } else {
                $value = $client_data[$column];
            }

            //Gather all the unique record access keys
            if(($properties["is_unique"] == true && $properties["is_nullable"] == false) || $column == "id"){
                $unique_record_access_keys[] = $column;
            }

            //before assigning the data, check the type and run any validation tests provided
            $validation = [
                "type" => $properties["data_type"],
                "tests" => isset($properties["validation"]) ? $properties["validation"] : null,
                "transform" => isset($properties["transform"]) ? $properties["transform"] : null
            ];

            //if we have some data to validate it, if we don't make sure that field is nullable
            if ($this->validate($column, $value, $validation)){
                error_log("validated {$column} with {$value}");
                $sanitized_fields[$column] = $value;
            } else {
                //Validator has recored the error, we have some bad data no point going any further
                break;
            }
        }

        //Enable the object methods it qualifies for
        foreach($this->operations as $method => $conditions){

            //check if any of read_one, update_one or delete_one by seeing if we have atleast one unique record access key
            if($method == "read_one" || $method == "update_one" || $method == "delete_one"){
                if(count($unique_record_access_keys) == 0){
                    continue;
                }
            }

            //if method equals read_list, check if we have any filters and its an array
            if($method == "read_list"){

                $order="";
                $paginate="";

                [$filter_template, $filter_params] = $this->build_filter($client_data);
 
                if(isset($client_data['ilike'])){

                    if($filter_template != "where "){
                        $filter_template .=  "and ";
                    }

                    $fields = json_decode($client_data['ilike'], true);

                    $filter_template.= "(";                    

                    foreach($fields as $key => $val){
                        error_log($key);
                        $filter_template .= " cast({$key} as text) ilike :" . $key;

                        //if not the last element in the array, add an or
                        if($key != array_key_last($fields)){
                            $filter_template .= " or";
                        }

                        $filter_params[$key] = "%" . $val . "%";
                    }

                    $filter_template.= ") ";
                }

                if(isset($client_data['row_status'])){

                    if($filter_template != "where "){
                        $filter_template .=  "and ";
                    }

                    $filter_template .= "is_active=:is_active ";

                    if ($client_data['row_status'] == "active"){

                        $filter_params['is_active'] = 't';
                    }

                    if ($client_data['row_status'] == "inactive"){

                        $filter_params['is_active'] = 'f';
                    }

                }

                $active_page = isset($client_data['active_page']) ? intval($client_data['active_page']) : null;
                $page_size = isset($_GET['page_size']) ? intval($_GET['page_size']) : null;

                if($active_page && $page_size){

                    if ($active_page < 1) {
                        $active_page = 1;
                    }

                    if ($page_size < 1 || $page_size > 100) {
                        $page_size = 100;
                    }
                    
                    $offset = ($active_page - 1) * $page_size;
                    $paginate=" LIMIT $page_size OFFSET $offset";
                }

                if(isset($client_data['order_by'])){

                    #There is an advanced query that needs to be built if we are working with agg json data, we flag these type with a json_ prefix

                    [$field, $direction] = explode("|", $client_data['order_by']);

                    //this portion needs to be refactored to be more dynamic as we are using fixed table names and column names
                    if(substr($client_data['order_by'], 0,11) == "json_order_"){

                        //extract the direction by splitting the order_by on space
                        $json_field = substr($field,11);
    
                        //get the inverse of the direction
                        $direction_inverse = $direction == "asc" ? "desc" : "asc";

                        // order by (select (json_agg({$json_field} order by {$json_field}->>'order' asc))[0]->>'value' from (select json_array_elements({$json_field}) {$json_field}) as {$json_field})::int
                        $order = "ORDER BY (SELECT (item->>'is_complete') FROM json_array_elements(prepsheet_items->'list') AS item WHERE item->>'name' = '$json_field' limit 1)::boolean $direction, ";
                        $order .= " (SELECT (item->>'target_datetime') FROM json_array_elements(prepsheet_items->'list') AS item WHERE item->>'name' = '$json_field' limit 1)::timestamp $direction ";
                    } else {
                        $order = " order by $field $direction";
                    }

                }

                if(isset($client_data['filter_by'])){

                    if($filter_template != "where "){
                        $filter_template .=  "and ";
                    }

                    #There is an advanced query that needs to be built if we are working with agg json data, we flag these type with a json_ prefix

                    [$field, $filter_value] = explode("|", $client_data['filter_by']);

                    //this portion needs to be refactored to be more dynamic as we are using fixed table names and column names
                    if(substr($client_data['filter_by'], 0,12) == "json_filter_"){

                        //extract the direction by splitting the order_by on space
                        $json_field = substr($field,12);
                        $filter_template .=" 'false' = ANY (SELECT item ->> 'is_complete' FROM json_array_elements(prepsheet_view.prepsheet_items -> 'list') AS item WHERE item ->> 'name' = 'we owe') ";


                    } else {
                        $filter= " $field=:$field";
                        $filter_params[$field] =  $filter_value;
                        $filter_template .= $filter . " ";
                    }

                }

                if($filter_template == "where "){
                    $conditions['response']['filter_template'] = "where :num = :num";
                    $conditions['response']['filter_params'] = ["num" => 1];                        
                } else {
                    $conditions['response']['filter_template'] = $filter_template;
                    $conditions['response']['filter_params'] = $filter_params;     
                }
                
                $conditions['response']['paginate'] = $paginate;
                $conditions['response']['order_by'] = $order;
            }

            $methods[$method] = $conditions; 
        }

        error_log("MODEL: enabled operations for ({$this->id}): " . json_encode(array_keys($methods)));
        //check if we have atleast one method
        if(count($methods) == 0){
            $this->errors[] = "MODEL: no methods enabled for ({$this->id})";
        }
        
        //if errors arrray greater than 0, then return false
        if(count($this->errors) > 0){
            #if in debug mode loop throough and print each error neatly to error_log
            // if($_SERVER["APP_DEBUG"]){
            foreach($this->errors as $error){
                error_log("[Error]: " . $error);
            }
            // }
            return false;
        } 
        
        //inherit the primary key from model
        return new Crud($methods, $this->table, $sanitized_fields, $unique_record_access_keys, $this->db);

    }



    /*            //$column = "delated_at"
    *   A function that will validate the data based on the model
    *   @param $value - the value to be validated
    *   @param $validation - the validation rules to be applied
    */
    public function validate($key, &$value, $validation){
        //error_log($key. " " . $value . " " . json_encode($validation));
        //check if the value is of the correct type
        if(!$this->type($value, $validation["type"])){
            $this->errors[$key] = "VAL_ERR: VALUE('{$value}') incorrect type, needs TYPE(${validation["type"]})";
            return false;
        }

        //check if the value passes any validation tests
        if(isset($validation["tests"])){
            foreach($validation["tests"] as $test_type => $test_comparison){
                if(!$this->test($value, $test_type, $test_comparison)){
                    $this->errors[$key] = "$test_type($test_comparison) error!";
                    return false;
                }
            }
        }

        if(isset($validation["transform"])){
            foreach($validation["transform"] as $case){
                $value = $this->transform($case, $value);
                error_log("transformed {$value} to {$case}");
            }
        }

        return true;
    }
    //PROTOtype
    // private function SQL($key, $data, &$params){

    //     $template = '';

    //     switch ($key) {
    //         case 'start':
    //             # code...
    //             return "WHERE ";
    //         case 'model_where':
    //             # code...
    //             break;
    //         case 'client_where':
                
    //             if (!isset($data['filterx'])){
    //                 return $template;
    //             }

    //             $parts = json_decode($data['filterx']);
                
    //             if (isset($parts['active'])){
    //                 $template .= "is_active=:is_active";
    //                 //$params['is_active']
    //             }
                
    //             if (isset($parts['inactive'])){
    //                 $template .= "is_active=:is_active";
    //             }

    //             if (isset($parts['we_owe'])){
    //                 $template .= "is_active=:is_active";
    //             }

    //             if (isset($parts['pending'])){
    //                 $template .= "status=:status";
    //             }

    //             if (isset($parts['ownership'])){
    //                 $template .= "EXISTS (SELECT 1 FROM jsonb_array_elements(prepsheet_notifications->'list') as x WHERE (x->>'person_id')::int = 1)";
    //             }

    //             if (isset($parts['department_permission'])){
    //                 $pg_array = "{" . implode(",", $user_ids) . "}";
    //                 $template .= "EXISTS ( SELECT 1 FROM jsonb_array_elements(prepsheet_items->'list') as item, unnest(item->'permissions')::int as permission_id, unnest('$pg_array'::int[]) as user_id WHERE permission_id = user_id)";
    //                 $template .= "EXISTS (
    //                     SELECT 1
    //                     FROM json_array_elements(prepsheet_items->'list') AS item
    //                     CROSS JOIN LATERAL (
    //                         SELECT json_array_elements_text(item->'permissions')::int AS permission_id
    //                     ) AS permissions
    //                     WHERE json_typeof(item->'permissions') = 'array' 
    //                     AND (item->>'is_complete')::boolean = false
    //                     AND permission_id = ANY('$pg_array'::int[]) -- replace ARRAY[12] with your array of IDs
    //                 )";

    //             }

    //             return $template;
    //         case 'ilike':

    //             if (!isset($data['ilike'])){
    //                 return $template;
    //             }

    //             $fields = json_decode($client_data['ilike'], true);               

    //             foreach($fields as $key => $val){
       
    //                 $template .= " cast({$key} as text) ilike :" . $key;
    //                 //if not the last element in the array, add an or
    //                 if($key != array_key_last($fields)){
    //                     $template .= " or";
    //                 }

    //                 $params[$key] = "%" . $val . "%";
    //             }

    //             return $template.= ")";

    //         case 'order_by':
    //             # code...
    //             break;
    //         case 'dir':
    //             # code...
    //             break;
    //         case 'limit':
    //             # code...
    //             break;
    //         case 'offset':
    //             # code...
    //             break;
    //         default:
    //             # code...
    //             break;
    //     }

    // }

    /*
    *   A function that will test the value against the test type
    *   @param $test_value - the value to be tested
    *   @param $test_type - the type of test to be applied
    *   @param $test_comparison - the value to be compared against
    */
    public function test(string $test_value, string $test_type, $test_comparison){

        $this->debug && error_log("DEBUG: testing {$test_type} on {$test_value} vs {$test_comparison}");

        switch ($test_type) {
            case 'required':
                return $test_value != null && $test_value != "";
            case 'min':
                return $test_value >= $test_comparison;
            case 'max':
                return $test_value <= $test_comparison;
            case 'minlength':
                return strlen($test_value) >= $test_comparison;
            case 'maxlength':
                return strlen($test_value) <= $test_comparison;
            case 'email':
                return filter_var($test_value, FILTER_VALIDATE_EMAIL);
            case 'step':
                return $test_value % $test_comparison == 0;
            case 'url':
                return filter_var($test_value, FILTER_VALIDATE_URL);
            case 'ip':
                return filter_var($test_value, FILTER_VALIDATE_IP);
            case 'pattern':
                // Escape delimiter for PHP if necessary
                $pattern = $test_comparison;
                if (substr($pattern, 0, 1) !== '/' && substr($pattern, -1) !== '/') {
                    $pattern = '/' . $pattern . '/';
                }
                // Escape delimiter for JSON
                $pattern_for_json = str_replace('/', '\\/', $test_comparison);
                $result = preg_match($pattern, $test_value);
                return $result;
            default:
                error_log("VAL_ERR: TEST({$test_type}) not recognized, check model configuration");
                return false;
        }
    }


    /*
    *   A function that will test the value against the test type
    *   @param $value - the value to be tested
    *   @param $type - the type to be tested against
    */
    public function type($value, string $type){
        switch ($type) {
            case 'character_varying':
            case 'character':
            case 'char_low':
            case 'text':
                return is_string($value);
            case 'string':
                return is_string($value);
            case 'float':
                return is_float($value);
            case 'number':
            case 'integer':
                return is_numeric($value);
            case 'boolean':
                return is_bool($value);
            case 'array':
                return is_array($value);
            case 'object':
                return is_object($value);
            case 'null':
                return is_null($value); 
            case 'timestamp_without_time_zone':
                return true;
                $d = DateTime::createFromFormat('Y-m-d H:i:s', $value);
                return $d && $d->format('Y-m-d H:i:s') === $value;        
            case 'jsonb':
            case 'json':
                //suppress the warning that json_decode will throw if the value is not json
                
                if (!json_decode($value)){
                    return false;
                }

                return true;
            default:
                error_log("No type test specified for {$type}");
                return false;
        }
    }

    public function transform($case, &$value){
        error_log("transforming {$value} to {$case}");
        switch ($case) {
            case 'uppercase':
                return strtoupper($value);
            case 'lowercase':
                return strtolower($value);
            case 'capitalize':
                return ucwords($value);
            case 'title':
                return ucfirst($value);
            case 'camel':
                return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $value))));
            case 'snake':
                return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $value));
            case 'kebab':
                return strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', $value));
            default:
                error_log("No transform specified for {$case}");
                return $value;
        }
    }

    /*
    *   A function that will return the fields of the model and their data (optional) to the client
    *   @param $mode - offers the flexibility to return and apply the model in different ways
    *   @param $primary_key - the primary key of the model (optional)
    */

    #A function that will return the fields of the model and their data (optional) to the client
    public function export(string $mode, int $primary_key = null){

        switch ($mode) {
            case 'form':
                return ["fields" => $this->fields];
            default:
                # code...
                break;
        }
    }

    /*
    *   Something went wrong dump all the important details into an array that will be marked up in json
    */
    public function dump(){
        //TODO provide a more complete picture
        return $this->errors;
    }
}


?>
