<!DOCTYPE html>
<html lang="en">
    <head>
        <?php echo "<title>{$_SERVER['APP_NAME']} {$_SERVER['APP_VERSION']}</title>";?>

        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
	    <meta http-equiv="ScreenOrientation" content="autoRotate:disabled">

        <link rel="icon" href="imgs/logo_16x16.png" type="image/png" />

        <script>

            let app;

            //persistent, client and non secure storage for app
            const store = window.localStorage;
            
            //
            const version = "<?php echo $_SERVER['APP_VERSION']; ?>";
            const runmode = "<?php echo $_SERVER['APP_RUNMODE']; ?>";

            const redirect_view = "<?php echo isset($_GET['view_name']) ? $_GET['view_name'] : null; ?>";
            const redirect_id = "<?php echo isset($_GET['view_id']) ? $_GET['view_id'] : null; ?>";

            const load_script = function (src) {
                return new Promise((resolve, reject) => {

                    let element;
                    const [ type ] = src.split("/");

                    if (type === "js"){
                        element = document.createElement('script'); 
                        element.src = `${src}?v=${version}`;
                        element.type = 'text/javascript';
                    } else if (type === "css"){
                        element = document.createElement('link');
                        element.href = `${src}?v=${version}`;
                        element.rel = 'stylesheet';
                    }

                    element.onload = () => resolve(element);
                    document.head.appendChild(element);

                });
            };

            (function initialize(){
                //app resouces
                const imports = [ //core
                    'js/animation.js',
                    'js/utility.js',
                    'js/ui.js',
                    'js/network.js',
                    'js/component.js',
                    'js/modules_views.js',
                    'js/modules_modals.js',
                    'js/modules_core.js',
                    'js/token.js',
                    'js/core.js',
                    'js/app.js',
                    'js/events.js',
                    'css/modules_core.css',
                    'css/modules_modals.css',
                    'css/modules_views.css',
                    'css/presets.css'
                ];
                const promises = imports.map(file => load_script(file));

                Promise.all(promises)
                    .then(() => {
                        // debugger;
                        app = Application.get()
                        app.version = version;
                        app.runmode = runmode;
                        app.is_mobile = true;
                        app.store = store;
                        app.start_view = {
                            name: redirect_view || "home",
                            id: redirect_id || null
                        };
                    })
                    .catch(err => console.log(err));
            })();

        </script>
    </head>
    
    <body>

        <!-- Block Content -->
        <div class="side-bar">
		<input type="hidden" name="IL_IN_ARTICLE">
	</div>
        <div id="app-containor">
            <header></header>
            <main></main>
            <nav class="app-min"></nav>

            <!-- Overlayed Content -->
            <div id="modal-overlay">
                <section id="modal-containor">
                    <button id="modal-close-button" onclick="nav.modal_close()">X</button>
                    <div id="modal-content" class="modal-std"></div>
                </section>
            </div>

            <div class="app-min" id="screen"></div>

        </div>
        <div class="side-bar">
		<input type="hidden" name="IL_IN_ARTICLE">
	</div>

        <div id="show-message"></div>
        <div onclick="close_expand(this)" id="expand"></div>
        
        <!-- Hidden Content -->
        <?php
            //The allowed parametrs give us the capability to initialize the app on a specific view
            $allowed = ["view", "ticker"];

            $valid_params = array_filter($_GET, fn($p) => in_array($p, $allowed), ARRAY_FILTER_USE_KEY);

            $callback = fn($k, $v) => "data-{$k}='{$v}'";
            $data_attributes = implode(" ", array_map($callback, array_keys($valid_params), array_values($valid_params)));

            echo "<input id='data-store' {$data_attributes} type='hidden' />";

        ?>
    </body>
</html>

