try {
    
}
catch (ex) {
    console.log(ex);
    message.channel.send(Util.emojis.error + " **Error:** ERROR_MESSAGE ");
}

//For functions that are susceptible to errors...

try {

}
catch (ex) {
    console.log(ex);
    message.channel.send(Util.emojis.error + " **Error:** ERROR_MESSAGE: `" + ex.message + "`");
}
