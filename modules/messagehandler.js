// JavaScript source code

var methods = [];
const Discord = require('discord.js');
const settings = require("../settings/settings.json");
var utilCommands = require("./utilsmodule.js");
var client;
var guild;

///var dmCommands = [".pm ", ".dm "];

methods.init = function(c, guildIn){
    client = c;
    guild = guildIn;
}

methods.processMessage = function(anonSender, message, anonMembers){

    // Strip all @ pings
    utilCommands.logMsg("Processing message...");
    utilCommands.logMsg("Attempting to replace all @ characters");
    var content = utilCommands.replaceAll(message.content, "@", " ");

    methods.sendMessageAllChannels(anonSender, message, content, anonMembers);
    methods.sendAttachmentAllChannels(anonSender, message);

    utilCommands.logMsg("Finished processing message in messagehandler.js");
}

// Old ping function
methods.pingMember = function(anonSenderName, receiverMemberID){
    var contentStripped = "<@" + receiverMemberID + "> `You were pinged by " + anonSenderName + ". Only you can see this message.`";
    methods.serverMessage(contentStripped, receiverMemberID);
    //methods.sendMessageIndividual(anonSenderName, contentStripped, anonReceiverName, receiverMemberID);
}

// WIP
methods.serverMessage = function(messageText, receiverMemberID){
    for (channel of guild.channels.array()) {
        if (channel.name === receiverMemberID) {
            utilCommands.logMsg("Sending server message to channel " + channel.id + " for userID " + receiverMemberID);
            channel.send("**SERVER** " + messageText);
        }
    }
}

// WIP private message
methods.sendMessageIndividual = function(anonSenderName, contentStripped, anonReceiverName, receiverMemberID){

    utilCommands.logMsg(anonSenderName + " is sending an individual message to: " + anonReceiverName + " userID: " + receiverMemberID);

    var text = contentStripped;

    if (text !== "undefined" && text != null && text != "") {
        utilCommands.logMsg("text is defined, looking through guilds...");

        for (channel of guild.channels.array()) {
            if (channel.name === receiverMemberID) {
                utilCommands.logMsg("Sending individual message to channel " + channel.id + " for userID " + receiverMemberID);
                channel.send("**PRIV** `<" + anonSenderName + ">` " + text);
            }
        }

    } else {
        utilCommands.logMsg("text was undefined or null.");
    }
}

methods.sendMessageAllChannels = function(anonSender, message, contentStripped, anonMembers){
    
    var text = contentStripped;
    var channelSpecificText = "";

    if (text !== "undefined" && text != null && text != "") {
        utilCommands.logMsg("text is defined, looking through guild " + guild.name + " ...");
        utilCommands.logMsg("guild.channels " + guild.channels + " ...");

        for (channel of guild.channels.array()) {

            console.log("channel.name:" + channel.name);
            channelSpecificText = text;

            if (channel.name != "rules" && channel.type === "text") {

                // Handle pings
                for(var i=0; i < anonMembers.length; ++i){
                    var anonReceiverName = anonMembers[i].anonName;
                    var anonReceiverID = anonMembers[i].member;

                    // console.log("Checking channel name:" + channel.name + " against userid:" + anonReceiverID);

                    // Replace username with a ping if this channel is for that user
                    if(anonReceiverID === channel.name){
                        console.log("Attempting to replace " + anonReceiverName + " with " + anonReceiverID + " if it exists...");
                        channelSpecificText = utilCommands.replaceAll(channelSpecificText, anonReceiverName, "<@!" + anonReceiverID + ">");
                    }
                }

                utilCommands.logMsg("Sending message from memberID:" + message.member.id + " channelID:" + channel.name);

                //webhookSend(channel, channelSpecificText, anonSender.anonName, null);

                console.log("anonSender.anonName:" + anonSender.anonName);
                
                var embededMessage = new Discord.RichEmbed();

                embededMessage.setAuthor(anonSender.anonName);
                embededMessage.setDescription(channelSpecificText);
                embededMessage.setColor(anonSender.color);

                var thumbnailURL = getAvatarURL(anonSender.anonName);
                console.log("------------------- thumbnail\n" + thumbnailURL);

                embededMessage.setThumbnail(thumbnailURL);
                //embededMessage.setTimestamp();

                channel.send({
                    embed: embededMessage
                  })
                    .catch(console.error);
            }

        }
        utilCommands.logMsg("Sent message to appropriate channels.");
    } else {
        utilCommands.logMsg("text was undefined or null.");
    }
}

var attachmentUrls = [];

methods.sendAttachmentAllChannels = function(anonSender, message){
    
    var attachments = message.attachments;

    // Check for attachments, then add them to the message
    if (attachments !== "undefined" && attachments != null) {
        utilCommands.logMsg("Trying to add attachments.");
        attachments.forEach(getAttachmentURLs);

        if (attachmentUrls.length > 0) {
            for (channel of guild.channels.array()) {
                utilCommands.logMsg("memberID:" + message.member.id + " channelID:" + channel.name + " attachments:" + attachmentUrls);
                if (channel.name != "rules" && channel.type === "text") {

                    console.log("anonSender.anonName:" + anonSender.anonName);

                    var embededMessage = new Discord.RichEmbed();

                    embededMessage.setAuthor(anonSender.anonName);
                    embededMessage.setImage(attachmentUrls[0]);
                    embededMessage.setColor(anonSender.color);

                    var thumbnailURL = getAvatarURL(anonSender.anonName);
                    console.log("------------------- thumbnail " + thumbnailURL);

                    embededMessage.setThumbnail(thumbnailURL);
                    //embededMessage.setTimestamp();

                    channel.send({
                        embed: embededMessage
                    })
                        .catch(console.error);
                    }
            }
        }
        attachmentUrls = [];
    }
}

function getAttachmentURLs(value, key, map) {
    utilCommands.logMsg(`m[${key}] = ${value.url}`);
    attachmentUrls.push(value.url);
}

function getAvatarURL(username){
    let avatarURL = `https://identicon-api.herokuapp.com/${username.replace(/[^a-zA-Z]/g, '')}/256?format=png`;
    return avatarURL;
}

/**
 * Send a message to a channel via a Webhook
 * @param {TextChannel} channel Channel Object
 * @param {string} content Message Content
 * @param {string} username Hook Username
 * @param {string} [avatar] Hook Avatar URL
 * @returns {Promise.<Message>}
 */
const webhookSend = async (channel, content, username, avatar) => {

    console.log("Using the webhook send function...");

    // List webhooks
    let hooks = await channel.fetchWebhooks().catch(console.error);

    console.log("+++++++++++++++++++++ hooks:\n" + hooks);

    // Create a webhook if one doesn't exist
    if (hooks.array().length === 0) {
        await channel.createWebhook(channel.name).catch(console.error);;
    }

    // Generate default avatar if no URL is specified
    let avatarURL = avatar ? avatar :
    `https://identicon-api.herokuapp.com/${username.replace(/[^a-zA-Z]/g, '')}/256?format=png`;

    // Update webhook list
    let hook = (await channel.fetchWebhooks()).first().catch(console.error);;

    return hook.send(content, { username, avatarURL });
}


module.exports = methods;