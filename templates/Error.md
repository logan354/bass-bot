# Error Structures

## General 
```js
try {
}
catch (ex) {
    console.log(ex);
    message.channel.send(client.emotes.error + " **Error:** `ERROR_MESSAGE`");
}
```
## Susceptible Functions
```js
try {
}
catch (ex) {
    console.log(ex);
    message.channel.send(client.emotes.error + " **Error: ERROR_MESSAGE:** `" + ex.message + "`");
}
```
