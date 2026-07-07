<?php
// contact.php — Contact form backend for GoDaddy shared hosting
// Receives POST from the contact dialog and CLI sendmail.
// Sends email to the address below using PHP's mail() function.
//
// To test: POST to contact.php with fields: name, email, subject, message

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ── Config ──────────────────────────────────────────────────────
define('TO_EMAIL',   'rohanplante@gmail.com');
define('TO_NAME',    'Rohan Plante');
define('SITE_NAME',  'rohanplante.com');
define('RATE_LIMIT', 5);        // max submissions per IP per hour
define('RL_FILE',    sys_get_temp_dir() . '/nc_rl.json');

// ── CORS preflight ───────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Only accept POST ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── Rate limiting (simple file-based, per IP) ────────────────────
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$now  = time();
$data = [];
if (file_exists(RL_FILE)) {
    $data = json_decode(file_get_contents(RL_FILE), true) ?: [];
}
// Clean up old entries
$data = array_filter($data, fn($t) => ($now - $t) < 3600);
$hits = array_filter($data, fn($t, $k) => $k === $ip, ARRAY_FILTER_USE_BOTH);
if (count($hits) >= RATE_LIMIT) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Too many requests. Please wait before trying again.']);
    exit;
}
$data[$ip . '_' . $now] = $now;
@file_put_contents(RL_FILE, json_encode($data), LOCK_EX);

// ── Read, sanitize, and validate inputs ──────────────────────────
// Header-safe: strip ALL control chars (incl. CR/LF) — prevents e-mail
// header injection for fields that end up in mail headers/subject.
function clean_header(string $v, int $max = 200): string {
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v);   // drop control chars
    return htmlspecialchars(trim(mb_substr($v, 0, $max)), ENT_QUOTES, 'UTF-8');
}
// Body-safe: keep newlines/tabs, drop other control chars.
function clean_body(string $v, int $max = 4000): string {
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', '', $v);
    return htmlspecialchars(trim(mb_substr($v, 0, $max)), ENT_QUOTES, 'UTF-8');
}

$name    = clean_header($_POST['name']    ?? '', 100);
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$subject = clean_header($_POST['subject'] ?? '', 200);
$message = clean_body($_POST['message']   ?? '', 4000);

// Reject if e-mail still contains line breaks (defense in depth for headers)
if ($email && preg_match('/[\r\n]/', $email)) { $email = false; }

if (empty($name)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Name is required.']);
    exit;
}
if (!$email) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'A valid email address is required.']);
    exit;
}
if (empty($message)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Message is required.']);
    exit;
}
if (empty($subject)) {
    $subject = 'Portfolio contact from ' . $name;
}

// ── Honeypot (hidden field — if filled, it's a bot) ──────────────
if (!empty($_POST['website'])) {
    // Silently succeed — don't let bots know they were caught
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

// ── Build the email ──────────────────────────────────────────────
$to      = TO_NAME . ' <' . TO_EMAIL . '>';
$headers = implode("\r\n", [
    'From: ' . SITE_NAME . ' <no-reply@' . SITE_NAME . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . PHP_VERSION,
]);

$body = <<<TXT
New message from your portfolio contact form.
────────────────────────────────────────────
Name:    {$name}
Email:   {$email}
Subject: {$subject}
────────────────────────────────────────────

{$message}

────────────────────────────────────────────
Sent from: {$_SERVER['HTTP_REFERER']}
IP: {$ip}
TXT;

// ── Send ─────────────────────────────────────────────────────────
$sent = mail($to, '[Portfolio] ' . $subject, $body, $headers);

if ($sent) {
    http_response_code(200);
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    // Log the error server-side; don't expose internals to the client
    error_log('contact.php: mail() failed for ' . $email);
    echo json_encode([
        'ok'    => false,
        'error' => 'The server could not send your message. Please email me directly at ' . TO_EMAIL,
    ]);
}
