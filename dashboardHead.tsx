import { NextPage } from "next";

const DashboardHead: NextPage = () => {
  return (
  
    <head>
        {/* <!--Title--> */}
        <title>ECash Coin</title>

        {/* <!-- Meta --> */}
        <meta charSet="utf-8"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge"/>

        {/* <!-- MOBILE SPECIFIC --> */}
        <meta name="viewport" content="width=device-width, initial-scale=1"/>

        {/* <!-- FAVICONS ICON --> */}
        <link rel="shortcut icon" href="img/favicon.ico" />
        <link href="dash/vendor/bootstrap-select/dist/css/bootstrap-select.min.css" rel="stylesheet"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0"/>


        {/* <!-- Style css --> */}
        <link href="dash/css/style.css" rel="stylesheet" />

    </head>
  );
}

export default DashboardHead;
