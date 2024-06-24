<?php
// Load Composer's autoloader
require_once $_SERVER["APP_GIT_ROOT"]. '/vendor/autoload.php';

class Email {

    private $Host = 'smtp.office365.com';
    private $SMTPAuth = true;
    private $SMTPSecure = 'tls';
    private $Username = 'Chrism@salesprep.ca';    
    private $Password = 'Wineglass1!';
    private $Port = 587;

    private $from = 'Chrism@salesprep.ca';

    public function __construct() {
        
        $mail = new PHPMailer\PHPMailer\PHPMailer();

        //loop through the class properties and set them
        foreach($this as $key => $value) {
            $mail->$key = $value;
        }

        // Configure SMTP settings
        $mail->isSMTP();
        $mail->setFrom($this->from, 'Sales Prep');

        //Debug
        // $mail->SMTPDebug = 2; // enable logging
        // $mail->Debugoutput = 'file'; // save logs to a file
        // $mail->Debugoutput = dirname(__FILE__) . '/mail.log'; 

        $this->mail = $mail;
    }

    public function send($to, $subject, $template_path, $template_data = []) {

        //if $to is an array, loop through and add each address else add the single address
        if (is_array($to)) {
            foreach($to as $address) {
                $this->mail->addAddress($address);
            }
        } else {
            $this->mail->addAddress($to);
        }

        $this->mail->Subject = $subject;
        $this->mail->isHTML(true);
        $this->mail->Body = $this->render_template($template_path, $template_data);
        error_log("EMAIL: " . $this->mail->Body);
        // Send the email and return the result
        return $this->mail->send();

    }

    public function send_plain($to, $subject, $body){
        $this->mail->addAddress($to, 'test');
        $this->mail->Subject = $subject;
        $this->mail->Body = $body;
        $this->mail->isHTML(false);
        // Send the email and return the result
        return $this->mail->send();
    }

    private function render_template($path, $data) {
        extract($data);
        ob_start();
        include($path);
        return ob_get_clean();
    }
}
error_log("EMAIL: LOADED");

if (isset($argv[1]) && $argv[1] == '--cli=true') {
    echo "Sending email\n";
    $data = [];

    // Start from index 2 to skip the script filename and the '--cli=true' argument
    for ($i = 1; $i < $argc; $i++) {
        if (strpos($argv[$i], '--') === 0) {

            $parts = explode('=', substr($argv[$i], 2), 2);
            //set the key and value
            
            $data[$parts[0]] = $parts[1];
        }
    }

    // Check if the required arguments are provided
    if (isset($data['to'], $data['subject'], $data['body'])) {
        $email = new Email();
        $email->send_plain($data['to'], $data['subject'], $data['body']);
    } else {
        echo "Missing required arguments. Usage: php example.php --cli=true --to=recipient@example.com --subject='Email Subject' --body='Email Body'\n";
    }
}
