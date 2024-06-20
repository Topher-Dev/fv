<?php

include_once $_SERVER["APP_GIT_ROOT"]."/web/server/database.php";
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/model.php";
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/user.php";

class Controller {

    public $data = null;
    public $db = null;
    public $user = null;
    public $memcache = null;
    public $delim = "|";

    public $start_time;
    public $exit_string;

    //=========================================== Magic Methods ===========================================

    public function __construct($token, $data) {

        $this->start_time = microtime(true);
        
        $this->token = $token;
        $this->data = $data;
        
        $this->db = new Database(is_null($token->payload) ? 0 : $token->payload->sub);
        $this->user = is_null($token->payload) ?  null : new User($token->payload->sub, $this->db);

        if(!is_null($this->user) && $this->user->role_name != "su"){
            $this->data["company_id"] = $this->user->company_id;
        }

    }

    public function __destruct() {
        $elapsed_time = microtime(true) - $this->start_time;
        error_log($this->exit_string . " TIME({$elapsed_time})");
    }

    public function __call($name, $arguments) {
        error_log("[ARC] Method {$name} does not exist");
        return $this->error("Method {$name} does not exist");
    }

    public function get_object(){
	    
        $model = $this->get_model($this->model_name);

        $object = $model->build($this->data);

        if (!$object){
            return $this->error("Invalid data", $model->dump());
        }
	
	    return $object;

    }

    //=========================================== Model Driven ===========================================
    /*
    * All below methods use the properties of the model to define the paremeters of CRUD like queries, 
    * validate client to data to ensure the presence, type, format and restrictions are met as well as
    * provide the structure for client side validation and html form generation. They provide the 
    * They should cover most of the needs of this application, more other & advanced operations outside of the scope
    * of models are handle directly in the controller.
    */ 

    /*
    * Pull model & data used to build user form components
    */

    function decode_relations($relations){
        
        foreach($relations as $k => $v){
            if(is_array($v)){
                $relations[$k] = $this->decode_relations($v);
            } else {
                if(is_string($v)){
                    $relations[$k] = json_decode($v, true);
                }
            }
        }
        return $relations;
    }

    /*
    * Pull model & data used to build user form components
    */

    public function validate_request($m, $action){

        if (!isset($m->operations[$action])){
            return $this->error("Invalid request with action: {$action}");
        }

        $conditions = $m->operations[$action];

        if (!isset($conditions["request"]["requires"])){
            return $this->error("Invalid request no requires set: {$action}");
        }

        $requires = $conditions["request"]["requires"];
        
        // error_log($action);
        lg($m);

        if (isset($requires["role"])){
            $this->requires($requires["role"]);
        }

        if (isset($requires["param"])){
            $this->needs($requires["param"]);
        }

        if (isset($requires["filter"])){

            //fix
            if (!isset($requires["filter"][$this->user->role_name])){
                return;
            }

            $m->enforce_filter($requires["filter"][$this->user->role_name]);
        }
        
        return true;
    }

    public function form(){

        $m = $this->get_model(isset($this->data['mode']) ? $this->data['mode'] :  $this->model_name);
        $export = $m->export("form");

        $build_package = [
            "form" => [],
            "relations" => null
        ];

        //check if an id is in the data, if so we are editing a record
        if(isset($this->data['id'])){

            $this->validate_request($m, "read_one");

            $form_record = $m->build(["id" => $this->data["id"]]);
            if (!$form_record->read_one()){
                return $this->error("Failed to select {$m->table} record with id: {$this->data['id']}");
            }

            if(isset($this->data['get_relations']) && $this->data['get_relations'] == true){
                $form_record->get_relations();

                //recursively go through the relations array and ensure that none of the values contain json as we want to encode it once when we return it
                $relations = $this->decode_relations($form_record->relations);
                
                $build_package["relations"] = $relations;
            }
        } else {
            unset($export["fields"]["id"]);
        }

        //check if we need to load any options derivated from db data
        foreach($export['fields'] as $k => $f){

            // if ($f['include_in_form'] != true){
            //     continue;
            // }

            //dynamic options for things like select, radio, checkbox, dropdown etc
            $options = [];

            //We only want to export fields that have html properties
            if(isset($f["html"]) && is_array($f["html"]) && !empty($f["html"])){


                if (isset($f["html"]["options"]["type"]) && $f["html"]["options"]["type"] == "static"){
                    $options = $f["html"]["options"]["data"];
                    continue;
                }

                if(isset($f["html"]["options"]["type"]) && $f["html"]["options"]["type"] == "filter_by_role"){
                    if (isset($f["html"]["options"]["filter"][$this->user->role_name])){
                        $sql = $f["html"]["options"]["filter"][$this->user->role_name];
                        //get all the variables in the filter that are prefixed with a colon eg: :user_value
                        preg_match_all('/:[a-zA-Z0-9_]+/', $sql, $matches);
                        //build the template string
                        $filter_params = [];
                        //loop through each variable and add it to the params array
                        foreach($matches[0] as $match){

                            //check if the variable exists in the client data
                            if(!isset($this->data[substr($match, 1)])){
                                return $this->error("MODEL: filter variable ({$match}) does not exist in client data");
                            }

                            $filter_params[$match] = $this->data[substr($match, 1)];
                        }

                        $options = $this->db->query($sql, $filter_params);
                        //lg($options);

                    } else {
                        error_log("FILTER BY ROLE NOT FOUND");
                        $options = [
                            [
                                "value" => isset($form_record) ? $form_record->get_field("id") : null, 
                                "text" => isset($form_record) ? $form_record->get_field("name") : null
                            ]
                        ];
                    }
                }
            } else {
                continue;
            }
            
            $build_package["form"][] = [
                "id" => $m->table . "_" . $k,
                "name" => $k,
                "value" => isset($form_record) ? $form_record->get_field($k) : null,
                "template" => isset($f["html"]["template"]) ? $f["html"]["template"] : [],
                "element" => isset($f["html"]["element"]) ? ["options" => $options] + $f["html"]["element"] : $options,
                "label" => isset($f["html"]["label"]) ? $f["html"]["label"] : [],
                "validation" => isset($f["validation"]) ? $f["validation"] : [],
                "icon" => isset($f["html"]["icon"]) ? $f["html"]["icon"] : null,
            ];

        }
        return $this->success("Retrieved form {$this->model_name}", $build_package);
    }

    /*
    * Write one record into the database
    */
    public function create_one(){
        $m = $this->get_model($this->model_name);

        $this->validate_request($m, 'create_one');

        $object = $m->build($this->data);

        if (!is_object($object)){
            return $this->error("Invalid data", $m->dump());
        }

        //Insert into the Database
        if (!$object->create_one()){
            return $this->error("Failed to create record", $m->dump());
        };

        //todo updated the messages
        return $this->success("Created", $object->response());
    }

    /*
    * Write multiple like records to the database
    */
    public function create_list(){
        $m = $this->get_model($this->model_name);
        $this->validate_request($m, 'create_list');
    }

    /*
    * Read one record from the database via a uniquely index columns key and value
    */
    public function read_one(){
        $m = $this->get_model($this->model_name);
        $this->validate_request($m, 'read_one');

        $object = $m->build($this->data);
        
        if (!is_object($object) || !$object->read_one()){
            return $this->error("Invalid data", $m->dump());
        };

        return $this->success("Read", $object->response());
    }
    /*
    * Read multiple records from the database by a filter/condition 
    */
    public function read_list(){
        $m = $this->get_model($this->model_name);
        lg($this->model_name);
        $this->validate_request($m, 'read_list');
        //sleep(1);
        $object = $m->build($this->data);

        if (!$object){
            return $this->error("Invalid data", $m->dump());
        }

        $object->read_list();

        return $this->success("Read list", $object->response()); 
    }

    /*
    * Update one record from the database by a uniquely index columns key and value
    */
    public function update_one(){
        $m = $this->get_model($this->model_name);
        $this->validate_request($m, 'update_one');

        $object = $m->build($this->data);

        if (!is_object($object) || !$object->update_one()){
            return $this->error("Invalid data", $m->dump());
        };


        return $this->success("Updated", $object->response());
    }

    public function update_list(){
        $m = $this->get_model($this->model_name);
        $this->validate_request($m, 'update_list');
    }

    /*
    * Delete one record from the database by a uniquely index columns key and value
    */
    public function delete_one(){
        $m = $this->get_model($this->model_name);
        $this->validate_request($m, 'delete_one');

        $object = $m->build($this->data);
        $object->delete_one();

        return $this->success("Deleted", $object->response());
    }

    public function deactivate(){
        [ $id ] = $this->needs("id");

        $db = $this->get_db();

        if (!$db->update_one($this->table_name, "id", $id, ["is_active" => "f"])){
            return $this->error("Failed to deactivate {$this->table_name}");
        };

        return $this->success("{$this->table_name} Inactivated");
    }

    public function activate(){
        [ $id ] = $this->needs("id");

        $db = $this->get_db();

        if (!$db->update_one($this->table_name, "id", $id, ["is_active" => "t"])){
            return $this->error("Failed to activate {$this->table_name}");
        };

        return $this->success("{$this->table_name} Activated");
    }


    //needs is a function that checks if the data passed in the request has the required fields and returns an array of the required fields in the order they are passed in
    //this is useful for functions that require a specific set of data to be passed in the request
    public function needs($fields){
        
        $fields = explode(",", $fields);
        $data = [];
        $errors = [];

        foreach($fields as $f){
            if(!isset($this->data[$f])){
                $errors[] = $f;
            } else {
                $data[] = $this->data[$f];
            }
        }

        if (count($errors) > 0){
            $error_message = "Missing field(s): " . implode(",", $errors);
            return $this->error($error_message);
        }
        error_log("user has required fields");
        return $data;
    }

    //requires is a function that checks if the user has the required permissions to access the function
    //this is useful for functions that require a specific set of permissions to be passed in the request
    public function requires($permissions){
        lg($permissions);
        $permissions_array = explode(",", $permissions);
        foreach($permissions_array as $p){

            //trim any whitespace
            $p = trim($p);
            
            if($this->user->has_permission($p)){
                error_log("User has permissions");
                return true;
            }
        }
        return $this->error("Missing permission {$permissions}");
    }

    public function requires_department(string $departments_string){
        $departments = explode(",", $departments_string);
        foreach($departments as $department_name){

            //trim any whitespace
            $department_name = trim($department_name);
            
            if($this->user->has_department($department_name)){
                return true;
            }
        }
        return $this->error("Missing department allocation: {$departments_string}");
    }

    //this is a function for generating a checklist of relations of a spcific type for a specific record.
    //useful for predictably small lists of relations like branches, roles, etc. 
    //For larger lists of relations use a search function

    public function checklist_relations() {
            
        $this->requires("su,admin");

        [

            $junction_table, //table where the many to many relations are stored eg. branch_person
            $record_id, //id of unique record the user is editing eg. 1
            $record_name, //name of the record the user is editing //eg. person
            $relation_type //type of the relation the user is editing, eg. branch.

        ] = $this->needs("junction_table,record_id,record_name,relation_type");

        $db = $this->get_db();

        //make sure $this->filter_by is set
        if (!isset($this->filter_by)){
            return $this->error("Filter by not set");
        }

        
        //This is a list of all possible associations that can be made with the record
        $possible_associations = $db->select_list($relation_type . '_list_view', $this->get_filter(), [], ["id", "relation as name"]);

        //This is a list of the relations that are currently associations to the record
        $current_associations = $db->select_list(
            $junction_table . "_view", 
            "WHERE " . $record_name . "_id = :" . $record_name . "_id", 
            [$record_name . "_id" => $record_id]
        );

        //Get all the ids of the relations that are currently associated to the record
        $current_associations_ids = [];
        foreach ($current_associations as $assoctiation) {
            $current_associations_ids[] = $assoctiation[ $relation_type . "_id"];
        }

        //Build the checklist by comparing the possible associations to the current associations
        $checklist = [];
        foreach ($possible_associations as $association) {
            $checklist[] = [
                "id" => $association["id"],
                "name" => $association["name"],
                "checked" => in_array($association["id"], $current_associations_ids)
            ];
        }

        return $this->success("Relations checklist retrieved", $checklist);

    }

    public function assign_relation() {

        // $this->requires("su,admin");
        [

            $record_id,
            $record_name,
            $relation_id,
            $relation_type, 
            $junction_table,

        ] = $this->needs("record_id,record_name,relation_id,relation_type,junction_table");


        $db = $this->get_db();

        $insert_data = [
            $record_name . "_id" => $record_id,
            $relation_type . "_id" => $relation_id
        ];

        $id = $db->insert_one($junction_table, $insert_data);

        if ($id){
            return $this->success("$record_name assigned to $relation_type");
        } else {
            return $this->error("$record_name could not be assigned to $relation_type");
        };
    }
    
    public function remove_relation() {

        // $this->requires("su,admin");
        [

            $record_id,
            $record_name,
            $relation_id,
            $relation_type, 
            $junction_table,

        ] = $this->needs("record_id,record_name,relation_id,relation_type,junction_table");

        $db = $this->get_db();

        $where = "WHERE " . $record_name . "_id = :".$record_name."_id and ". $relation_type ."_id = :".$relation_type."_id";

        $relation = $db->find_one($junction_table, $where, [
            $record_name . "_id" => $record_id,
            $relation_type . "_id" => $relation_id
        ]);

        if ($relation){

            $relation_id = $relation["id"];
            
            if ($db->delete_one($junction_table, "id", $relation_id)){
                return $this->success("$record_name removed from $relation_type");
            } else {
                return $this->error("$record_name could not be assigned to $relation_type");
            };
            
        } else {
            return $this->error("$record_name could not be removed from $relation_type");
        }

    }

    //=========================================== CRUD ===========================================

    /**
     * Get a database connection
     * @return Database
     */

    public function get_db(){
        return $this->db;
    }

    /**
     * Get a model
     * @param string $model_id
     * @return Model
     */

    public function get_model(string $model_id ){
        return new Model($model_id, $this->db);
    }

    public function dropdown(){

        //$this->needs("");
        
        $db = $this->get_db();

        $stmt = $db->con->prepare("select id, name from {$this->table_name}");
        $stmt->execute();

        // Generate the dropdown menu HTML
        $html = '<select name="' . $this->table_name . '_id">';

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $html .= '<option value="' . $row['id'] . '">' . $row['name'] . '</option>';
        }

        $html .= '</select>';

        // Return the generated HTML
        return $this->success("HTML Recieved", [ "html" => $html ]);

    }

    public function event($code, $data){
            
        $db = $this->get_db();

        //check if we have a branch id in the data, if not throw a warning and return false
        if (!isset($this->data["branch_id"])){
            error_log("WARNING: No branch id in event data");
            return false;
        }

        //find the event type by code
        $event_type = $db->find_one("event_type", "WHERE code = :code", ["code" => $code]);

        //check if we found an event type
        if (!$event_type){
            error_log("WARNING: No event type found with code: {$code}");
            return false;
        }

        $insert_data = [
            "branch_id" => $this->data["branch_id"],
            "event_type_id" => $event_type["id"],
            "data" => json_encode($data)
        ];

        if (!$db->insert_one("event", $insert_data)){
            return false;
        };

        return true;
    }

    public function get_department_tree($branch_ids){
        
        $db = $this->get_db();

        $sql = <<<SQL
            WITH RECURSIVE org_hierarchy AS (
                SELECT
                    b.id AS branch_id,
                    d.id AS department_id,
                    d.name AS department_name,
                    d.monday_hours,
                    d.tuesday_hours,
                    d.wednesday_hours,
                    d.thursday_hours,
                    d.friday_hours,
                    d.saturday_hours,
                    d.sunday_hours
                FROM
                    company c
                    INNER JOIN branch b ON c.id = b.company_id
                    INNER JOIN department d ON b.id = d.branch_id
                WHERE
                    b.id in ($branch_ids)
                UNION
                SELECT
                    oh.branch_id,
                    d.id AS department_id,
                    d.name AS department_name,
                    d.monday_hours,
                    d.tuesday_hours,
                    d.wednesday_hours,
                    d.thursday_hours,
                    d.friday_hours,
                    d.saturday_hours,
                    d.sunday_hours
                FROM
                    org_hierarchy oh
                    INNER JOIN department d ON oh.department_id = d.branch_id
            )
            SELECT
                jsonb_object_agg(
                    branch_id,
                    (
                        SELECT
                            jsonb_object_agg(
                                department_id,
                                jsonb_build_object(
                                    'hours_of_operation',
                                    jsonb_build_object(
                                        'monday', monday_hours,
                                        'tuesday', tuesday_hours,
                                        'wednesday', wednesday_hours,
                                        'thursday', thursday_hours,
                                        'friday', friday_hours,
                                        'saturday', saturday_hours,
                                        'sunday', sunday_hours
                                    )
                                )
                            )
                        FROM
                            org_hierarchy
                        WHERE
                            branch_id = org_hierarchy.branch_id
                    )
                ) AS orgtree
            FROM
                org_hierarchy;
SQL;

        $results = $db->query($sql);

        $tree = json_decode($results[0]["orgtree"]);

        return $tree;
    }

    //=========================================== UTILITY ===========================================

    public function success(string $message = "", array $data = []) { 
        
        return $this->response([
            "status" => 0,
            "message" => "[Success] " . $message,
            "data" => $data
        ]);
    }

    public function error(string $message = "", array $data = []) {   
        return $this->response([
            "status" => 1,
            "message" => "[Error] " . $message,
            "data" => $data
        ]);
    }

    public function response($r){
        $this->exit_string = "[ARC Exit] STATUS({$r["status"]}) MSG({$r["message"]})";
        echo json_encode($r);
        exit;
    }

}
