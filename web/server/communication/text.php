<?php

// require_once '/path/to/twilio-php/autoload.php';

// use Twilio\Rest\Client;

class TextSender {
    private $to;
    private $message;
    private $sid;
    private $token;
    private $from;

    public function __construct($to, $message, $sid, $token, $from) {
        $this->to = $to;
        $this->message = $message;
        $this->sid = $sid;
        $this->token = $token;
        $this->from = $from;
    }

    public function send() {
        $client = new Client($this->sid, $this->token);

        $message = $client->messages->create(
            $this->to,
            [
                'from' => $this->from,
                'body' => $this->message
            ]
        );

        return $message->sid;
    }
}


// require_once '/path/to/TextSender.php';

// $to = '+1234567890'; // recipient phone number
// $message = 'Hello, this is a test message!'; // text message
// $sid = 'your_twilio_account_sid';
// $token = 'your_twilio_auth_token';
// $from = '+1987654321'; // Twilio phone number

// $textSender = new TextSender($to, $message, $sid, $token, $from);
// $textSender->send();