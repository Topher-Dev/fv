<?php

class Database
{
    public $con;
    public $engine = "pgsql";
    public $last_id = null;
    public $fetchAll_mode = PDO::FETCH_ASSOC;
    public $started = 0;
    public $stopped = 0;
    public $debug = true;
    
    private $author_id; 

    /*==================================================== Initialize ====================================================*/
    public function __construct($author_id) {

        $this->stopwatch(true);
        // connect to the database
        $connection_string = sprintf("{$this->engine}:host=%s;port=%d;dbname=%s;user=%s;password=%s", 
                $_SERVER['DATABASE_HOST'],
                $_SERVER['DATABASE_PORT'],
                $_SERVER['DATABASE_NAME'],
                $_SERVER['DATABASE_USER'],
                $_SERVER['DATABASE_PASSWORD']);

        $pdo = new PDO($connection_string);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $this->con = $pdo;

        $this->author_id = $author_id;
    }

    public function __destruct() {
        $this->stopwatch(false);
    }

    /*==================================================== Engine ====================================================*/

    public function stopwatch($state){   
        if ($state){
            $this->started = microtime(true);
        } else {
            $this->stopped = microtime(true);
            $this->duration = $this->stopped - $this->started;
        }
    }
    /* 
        default datetime add 0 days
        $datetime_to_add = 'P0D' - add 0 days

        $datetime_to_add = 'P1D' - add 1 day
        $datetime_to_add = 'P1M' - add 1 month
        $datetime_to_add = 'P1Y' - add 1 year
        add hours
        $datetime_to_add = 'PT1H' - add 1 hour
    */
    public function get_datetime($datetime_to_add = 'P0D'){
        $datetime = new DateTime();
        $datetime->add(new DateInterval($datetime_to_add));
        return $datetime->format('Y-m-d H:i:s');
    }

    /*==================================================== CRUD ====================================================*/ 

    public function insert_one(String $table, Array $data, Bool $auto_commit = true) {

        // $auto_commit && $this->begin();
        $data['created_by'] = $this->author_id;
        error_log($this->author_id);
        $columns = implode(',', array_keys($data));
        $placeholders = implode(",", array_map(fn($k) => ":{$k}", array_keys($data)));

        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $stmt= $this->con->prepare($sql);

        $this->debug && error_log($stmt->queryString);

        try {
            $stmt->execute($data);
            // $auto_commit && $this->commit();
            $this->last_id = $this->con->lastInsertId();
            return $this->con->lastInsertId();
        } catch (\Throwable $th) {
            // $auto_commit && $this->rollback();
            error_log($th->getMessage());
            return false;
        }
    }

    public function insert_many(String $table, Array $rows) {

        $keys = array_keys($rows[0]);
        $fields = implode(", ", $keys);
        $values = ":" . implode(", :", $keys);

        //log a count of the rows
        error_log(count($rows));
        
        $sql = "INSERT INTO vehicle_serti ($fields) VALUES ($values) ON CONFLICT (stock_no, branch_id) DO NOTHING";
        error_log($sql);
        $stmt = $this->con->prepare($sql);

        try {


            foreach($rows as $row) {
               
                // Create an associative array with placeholders as keys
                $placeholders = array_combine(array_map(fn($v) => ":$v", $keys), array_values($row));
            
                $stmt->execute($placeholders);
            }

            return true;

        } catch (\Throwable $th) {

            error_log($th->getMessage());
            return false;
        }
        
    }


    /*
     *  insert a large amount of data into the database
     * @param array $data - an array of associative arrays
     * @param string $table - the name of the table to insert into
     */
    public function copy(array $data, string $table){

        $temp_file = tempnam(sys_get_temp_dir(), 'COPY');
        $handle = fopen($temp_file, 'w');

        // Write the data to the file
        foreach ($data as $row) {
            fputcsv($handle, $row);
        }
        
        fclose($handle);

        // Create the column list for the COPY command
        $columns = implode(',', array_keys($data[0]));

        $user = $_SERVER['DATABASE_USER'];
        $database = $_SERVER['DATABASE_NAME'];

        // Execute the COPY command
        $command = "psql -U $user -d $database -c \"\\COPY $table ($columns) FROM '$temp_file' WITH (FORMAT CSV)\"";

        exec($command, $output, $return_var);

        // Remove the temporary file
        unlink($temp_file);

        return $return_var != 0 ? false : true;

    }

    public function update_one(string $table, $id, $value, array $data) {

        //set the updated_at and updated_by fields
        $data['updated_at'] = $this->get_datetime();
        $data['updated_by'] = $this->author_id;

        $updates = implode(',', array_map(fn($k) => "{$k} = :{$k}", array_keys($data)));
        error_log(json_encode($data));
        $sql = "UPDATE {$table} SET {$updates} WHERE {$id} = :{$id}";

        $stmt = $this->con->prepare($sql);

        $this->debug && error_log($stmt->queryString);
        
        $data[$id] = $value;

        try {
            $stmt->execute($data);
            return true;
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return false;
        }

    }

    public function update_list(string $table, array $data, array $ids){
        $updates = implode(',', array_map(fn($k, $v) => "{$k} = ?", array_keys($data), range(1, count($data))));
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
    
        $sql = "UPDATE {$table} SET {$updates} WHERE id IN ($placeholders)";
        error_log($sql);
        $stmt = $this->con->prepare($sql);
    
        $this->debug && error_log($stmt->queryString);
    
        // Combine $data with $ids for executing the statement
        $execute_params = array_values($data);
        foreach ($ids as $id) {
            $execute_params[] = $id;
        }
    
        try {
            $stmt->execute($execute_params);
            return true;
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return false;
        }
    }
    

    public function delete_one($table,  $id, $value){
        $sql = "DELETE FROM $table WHERE {$id} = :{$id}";

        $stmt = $this->con->prepare($sql);

        $this->debug && error_log($stmt->queryString);
        
        try {
            $stmt->execute([$id => $value]);
            return true;
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return false;
        }

    }

    public function delete_by_function($name, $id){

        $sql = "SELECT $name(:id)";

        $stmt = $this->con->prepare($sql);

        $this->debug && error_log($stmt->queryString);

        // Bind the prepsheet ID parameter
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        if (!$stmt->execute()){
            return false;
        }

        return true;

    }

    public function check_unique($table, $column, $id, $case_sensitive = true) : bool {
      
        $stmt = $this->con->prepare("select $column from $table where upper($column) = upper(:id)");

        $this->debug && error_log($stmt->queryString);

        if ($stmt->execute(['id' => $id])){
        
            if ($stmt->fetch(PDO::FETCH_ASSOC)){
                return false;
            }
            
            return true;

        };

        $this->debug && error_log("Badly formatted statement, failed to execute");
        return false;
    }

    public function select_one(string $table, $id, $value, array $columns = []) {

        $selection = count($columns) > 0 ? implode(',', $columns) : "*";
        
        $sql = "SELECT {$selection} from {$table} WHERE {$id} = :{$id}";

        $this->debug && error_log("QUERY: SELECT {$selection} FROM {$table} WHERE {$id}={$value}");

        $stmt = $this->con->prepare($sql);
        
        try {
            $stmt->execute([$id => $value]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return false;
        }

    }

    //Find a single record from the database with a flexible where clause, if more then one row is returned throw an error
    public function find_one(String $table, String $where_filter = "", Array $where_params = [], array $columns_to_select = []) {
        
        $selection = count($columns_to_select) > 0 ? implode(',', $columns_to_select) : "*";

        $sql = "SELECT {$selection} from {$table} {$where_filter}";

        $stmt = $this->con->prepare($sql);

        $this->debug && error_log($stmt->queryString);
        
        try {

            $stmt->execute($where_params);
            //Check how many rows the query returned
            $count = $stmt->rowCount();
            
            if ($count > 1) {
                throw new Exception("More then one row returned from query, expected one");
            }
            return $stmt->fetch(PDO::FETCH_ASSOC);

        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return false;
        }

    }
        

    public function read_list($table, $filter, array $columns = []) {

        $selection = count($columns) > 0 ? implode(',', $columns) : "*";

        $sql = "SELECT {$selection} from {$table} {$filter}";

        $stmt = $this->con->prepare($sql);

        $this->debug && error_log($stmt->queryString);
        
        if ($stmt->execute()) {
            return $stmt->fetchAll($this->fetchAll_mode);
        };

        return false;

    }

    public function select_list($table, string $where_filter = "", array $where_params = [], array $columns_to_select = []) {

        $selection = count($columns_to_select) > 0 ? implode(',', $columns_to_select) : "*";

        $sql = "SELECT {$selection} from {$table} {$where_filter}";

        $stmt = $this->con->prepare($sql);

        $this->debug && error_log($stmt->queryString);
        
        error_log(json_encode($where_params));
        if ($stmt->execute($where_params)) {

            return $stmt->fetchAll($this->fetchAll_mode);
        };


        return false;

    }

    public function query($sql, array $params = []){
        $stmt = $this->con->prepare($sql);
        $this->debug && error_log($stmt->queryString);
        
        if ($stmt->execute($params)) {
            return $stmt->fetchAll($this->fetchAll_mode);
        };

        return false;
    }

    public function count($table, string $where_filter = "", array $where_params = [])
    {
        $sql = "SELECT count(*) from {$table} {$where_filter}";
        error_log($sql);
        $stmt = $this->con->prepare($sql);
        $stmt->execute($where_params);

        return $stmt->fetchColumn();
    }

    public function begin() {
        $this->con->beginTransaction();
    }

    public function commit() {
        try {
            $this->con->commit();
            return true; // Return true if commit is successful
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false; // Return false if commit fails
        }
    }

    public function rollback() {
        $this->con->rollback();
    }

    /*==================================================== CRUD ====================================================*/ 

    /**
     * Show executed query on call
     * @param boolean $logfile set true if wanna log all query in file
     * @return PdoWrapper
     */
    public function show_query() {
            // show error message in log file
            file_put_contents(self::SQL_LOG_FILE, date( 'Y-m-d h:i:s' ) . ' :: ' . $this->interpolateQuery() . "\n", FILE_APPEND );
            return $this;
    }

    /**
     * Replaces any parameter placeholders in a query with the value of that
     * parameter. Useful for debugging. Assumes anonymous parameters from
     *
     * @return mixed
     */
    protected function interpolateQuery() {
        $sql = $this->con->queryString;

    }
}

 

