<?php

include_once $_SERVER["APP_GIT_ROOT"]."/web/server/token.php";
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/database.php";
include_once $_SERVER["APP_GIT_ROOT"]."/web/server/communication/email.php";
#include_once $_SERVER["APP_GIT_ROOT"]."/web/server/communication/sms.php";

require $_SERVER["APP_GIT_ROOT"]. '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\WampServerInterface;
use Ratchet\MessageComponentInterface;

use Ratchet\Http\HttpServerInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

// $memcached = new Memcache();
// $memcached->connect('localhost', 11211);

function MyIoServerFactory($onStartCallback, $app, $port, $address = '0.0.0.0') {

    $ssl_options;
    $socket;
    $server;
    $loop=\React\EventLoop\Factory::create();

    if ($_SERVER["APP_RUNMODE"] == "dev"){
        $socket = new \React\Socket\Server($address . ':' . $port, $loop);
        $server = new \Ratchet\Server\IoServer($app, $socket, $loop);
    } else {
	echo "starting with ssl cert"; 
        $ssl_options = [
            'local_cert'  => '/etc/letsencrypt/live/salesprep.app/fullchain.pem',
            'local_pk'    => '/etc/letsencrypt/live/salesprep.app/privkey.pem',
            'allow_self_signed' => TRUE, // Allow self-signed certs (not recommended for production)
            'verify_peer' => FALSE,
        ];
    
       $socket = new \React\Socket\SecureServer(
            new \React\Socket\Server($address . ':' . $port, $loop),
            $loop,
            $ssl_options
        );
    
        $server = new \Ratchet\Server\IoServer($app, $socket, $loop);
    }

    call_user_func($onStartCallback, $loop);

    return $server;

}

class Pusher implements MessageComponentInterface,HttpServerInterface {

    protected $clients;
    protected $clientData;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->db = new Database(1);

        // global $memcached;
        // $this->memcache = $memcached;
        // $this->memcache->add('push_updates', []);
    }

    // Implementing HttpServerInterface's method to handle HTTP requests
    public function onHttpRequest(ConnectionInterface $conn, RequestInterface $request = null) {
        echo "HTTP Request: " . $request->getMethod() . ' ' . $request->getRequestTarget() . "\n";
        // You can add more logic here if needed
    }

    // Custom method to log WebSocket handshake response (this is not part of any interface)
    public function onHandshake(ConnectionInterface $conn, RequestInterface $request = null, ResponseInterface $response) {
        echo "HTTP Response for WebSocket upgrade sent.\n";
        // You can add more logic here if needed
    }

    // this is for loading the Alerts
    public function load_events(){
        $where= "where is_active=:is_active and status=:status";
        $params = [ "is_active" => 't', "status" => "unprocessed" ];
        $events = $this->db->select_list("event_alert_list_view", $where, $params);
        return $events;
    }

    public function process_events($ids){
        error_log("Processing events: ".json_encode($ids));
        $this->db->update_list("event", ["status" => "processed"], $ids);
    }

    public function get_contact_info($recipients, $notifyemail_recepients){

        $recipients = json_decode($recipients, true);
        $companies = $recipients['company'];
        $people = $recipients['person'];
        $branches = $recipients['branch'];
        $departments = $recipients['department'];

        // if there are any companies, then get the company contact info
        if (count($companies) > 0) {
            $company_ids = array_map(function($c) {  explode("|", $c)[0]; }, $companies);
            $company_ids = implode(",", $company_ids);
            $where = "where id in ($company_ids)";
            $company_contacts = $this->db->read_list("company", $where, ['email']);
        } else {
            $company_contacts = [];
        }

        // if there are any people, then get the person contact info
        if (count($people) > 0) {
            $person_ids = array_map(function($p) { return explode("|", $p)[0]; }, $people);
            echo json_encode($person_ids);
            $person_ids = implode(",", $person_ids);
            $where = "where id in ($person_ids)";
            $person_contacts = $this->db->read_list("person", $where, ['email', 'phone']);
        } else {
            $person_contacts = [];
        }
        //
        // 2024-03-21
        //
        // Merge the new entries with the existing $person_contacts
        $person_contacts = array_merge($person_contacts, $notifyemail_recepients);

        // if there are any deparments, then get the department contact info
        if (count($departments) > 0) {
            $department_ids = array_map(function($d) { return explode("|", $d)[0]; }, $departments);
            $department_ids = implode(",", $department_ids);
            $where = "where id in ($department_ids)";
            $department_contacts = $this->db->read_list("department", $where, ['email']);
        } else {
            $department_contacts = [];
        }

        // if there are any branches, then get the branch contact info
        if (count($branches) > 0) {
            $branch_ids = array_map(function($b) { return  explode("|", $b)[0]; }, $branches);
            $branch_ids = implode(",", $branch_ids);
            $where = "where id in ($branch_ids)";
            $branch_contacts = $this->db->read_list("branch", $where, ['email']);
        } else {
            $branch_contacts = [];
        }

        //combine the phone numbers and emails into two arrays
        $contacts = array_merge($company_contacts, $person_contacts, $department_contacts, $branch_contacts);

        //organize the contacts by email and phone, remove duplicates
        $emails = [];
        $phones = [];

        foreach ($contacts as $c) {
            if (isset($c['email'])) {
                $emails[] = $c['email'];
            }

            if (isset($c['phone'])) {
                $phones[] = $c['phone'];
            }
        }

        $emails = array_unique($emails);
        $phones = array_unique($phones);

        echo json_encode($emails);
        echo json_encode($phones);

        //return the contact info
        return ['email' => $emails, 'phone' => $phones];
    }

    public function handle_alerts($events){
        error_log("Dispatching alerts: ".json_encode($events));
        foreach ($events as $e) {
            // 
            // @@ 
            // 2024-03-21 
            // Decode the "data" column from $recipients and extract the email addresses

            $data = json_decode($e['data'], true);
            $notifyemail_string = isset($data['notifyemail']) ? $data['notifyemail'] : '';
            $notifyemail_addresses = [];

            $emails = explode('","', trim($notifyemail_string, '[]"\\'));
            foreach ($emails as $email) {
                $notifyemail_addresses[] = trim($email, '"\\');
            }
          
            $notifyemail_recepients = array_map(function ($email) {
                return ['email' => $email, 'phone' => '']; // Add a blank phone number
            }, $notifyemail_addresses);
            // end of extracting the people to notify

            // 22a
            $contact = $this->get_contact_info($e['alert_recipients'], $notifyemail_recepients);
            $alert_data = json_decode($e['data'], true);
            $subject = "[Alert] {$e['code']} {$alert_data['subjectline']} | NO: {$alert_data['stock_no']} | USER: {$alert_data['user']}";
            echo $subject;

            $href = "href='https://{$_SERVER['APP_DOMAIN']}?view_name={$alert_data['view']}&view_id={$alert_data['id']}'";

            //if in runmode dev, then add the dev domain to the href
            if ($_SERVER["APP_RUNMODE"] == "dev") {
                $href = "href='http://localhost:8080/index.php?view_name={$alert_data['view']}&view_id={$alert_data['id']}'";
            }
            
            echo $href;
            $alert_details = [
                "code" => $e['code'],
                "message" => $e['verbose_text'],
                "subject" =>  $subject,
                "href" => $href
            ];

            $alert_details = array_merge($alert_details, $alert_data);

            $this->dispatch_alert($contact['email'], "email", $alert_details);
        }
    }

    public function dispatch_alert($recipient, $medium, $details){
        if ($medium == "email") {
            $this->send_email($recipient, $details);
        } else if ($medium == "sms") {
            #$this->send_sms($recipient, $details);
        }
    }

    public function send_email(array $recipients, $details){

        $recipients_str = implode(",", $recipients);
        error_log("Sending email to: ".$recipients_str);

        $email = new Email();
        $path = $_SERVER["APP_GIT_ROOT"]."/web/server/communication/templates/alert.html";

        $email->send($recipients, $details["subject"], $path, $details);

    }

    public function send_sms($recipient, $message){
        error_log("Sending sms to: ".$recipient);
    }
    //
    // The following section checks the Alerts table for updates and completes as per activity type settings
    // loads all unprocessed activities and sends the alerts
    // @@
    //
    public function checkForUpdates() {
        // Check the 'update' key
        // this is polled every (x) seconds currently 5
        // the load_events loads all unprocessed events
        
        $events = $this->load_events();

        echo "Checking for updates: \n";
        echo json_encode($events);

        //if $update is not false, then there is an update
        if (!$events) {
            return;
        }

        //organize the push updates by branch_id
        $data=[];

        foreach ($events as $e) {

            $branch_id = $e['branch_id'];
            
            //if the branch_id is not set, then set it to an empty array
            if (!isset($data[$branch_id])) {
                $data[$branch_id] = [];
            }

            //add the push update to the branch_id array
            $data[$branch_id][] = $e;
        }

        foreach ($this->clients as $client) {

            $client_id = $client->resourceId;
            $client_data = $this->clientData[$client_id];
            $active_branch_id = $client_data['active_branch_id'];

            //if the client is not on the active branch or this is the creator of the push update, then skip
            if (!isset($data[$active_branch_id])) {
                continue;
            }

            $response_data = $data[$active_branch_id];

            //send the push updates to the client
            
            $client->send(json_encode([
                "status" => 0,
                "message" => "event_alert",
                "data" => $response_data
            ]));
        }

        // //Now dispatch the alerts via email or sms 
        $this->handle_alerts($events);

        $event_ids = array_map(function($e) { return $e['id']; }, $events);
        $this->process_events($event_ids);

    }

    public function onOpen(ConnectionInterface $conn, ?RequestInterface $request = null) {
        echo "Received a new HTTP request for WebSocket upgrade.\n";
        $this->clients->attach($conn);
        echo "New connection established! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $conn, $raw_message) {
        // Decode the message
        $data = json_decode($raw_message, true);
        echo print_r($data);
        // Handle auth with JWT token
        $token = new Token($data["token"]);
        $msg = $data["message"];
        $data = $data["data"];

        if(!$token->validate()) {
            
            $conn->send(json_encode([
                "status" => 2,
                "message" => "Invalid token"
            ]));

            $conn->close(); // Close the connection if token is invalid
            return;
        }

        $this->handleMessage($conn, $msg, $data, $token);

    }

    public function onClose(ConnectionInterface $conn) {
        unset($this->clientData[$conn->resourceId]);
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    private function handleMessage($conn, $key, $data, $token) {
        //use a case statement to handle different message types
        switch ($key) {
            case "add_credentials":
                
                $this->clientData[$conn->resourceId] = [
                    'person_id' => $token->payload->sub,
                    'role_id' => $token->payload->rol,
                    'company_id' => $token->payload->cmp,
                    'active_branch_id' => $data['active_branch_id']
                    // Add more data if necessary
                ];

                break;

        }
        
        echo "Received message: {$key}\n";
    }
}

$pusher = new Pusher();

$server = MyIoServerFactory(
    function($loop) use ($pusher) {
        $loop->addPeriodicTimer(5, array($pusher, 'checkForUpdates')); // Check every 5 seconds
    },
    new HttpServer(
        new WsServer($pusher)
    ),
    8040
);

$server->run();

