const functions = require('firebase-functions');
const admin = require('firebase-admin');
// admin.initializeApp(functions.config().firebase);
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.sendNotifications = functions.database.ref("/notifications/{notificationId}").onWrite((change, context) => {

    if (change.before.exists()) {
       return;
    } else {
    //    var eventLove = change.after.data.val();
    //    var author =eventLove.fullname;
    //    var title = eventLove.course;
    //    var key = eventLove.key;

    // const payload = {
    //     "data": {
    //                 "post_id": key
    //               },
    //     notification: {
    //         title: author +'Joined the app',
    //         body: `Course `+title,
    //         sound: "default",
    //         icon: "ic_launcher",

    //     }

    var NOTIFICATION_SNAPSHOT = change.after.val();
       var title =NOTIFICATION_SNAPSHOT.user;
       var bodytext = NOTIFICATION_SNAPSHOT.message;
       var iconimage = NOTIFICATION_SNAPSHOT.userProfileImage;
       //var PROJECT_ID = laravel-a72e8;

   
    const payload = {
        notification: {
            title: `New message from ${title}`,
            body: bodytext,
            icon: iconimage,
            //click_action: `https://${PROJECT_ID}.firebaseapp.com/,`
            //click_action: `https://${functions.config().firebase.authDomain}`
        }
    };
   
    //    const options = {
    //        priority: "high",
    //        timeToLive: 60 * 60 * 24 //24 hours
    //    };
    console.info(payload);

    function cleanInvalidTokens(tokensWithKey, results) {

        const invalidTokens = [];

        results.forEach((result, i) => {
            if(!result.error) return;

            // console.error("Error with token: ", tokensWithKey[i].token);

            switch(result.error.code) {
                case "messaging/invalid-registration-token":
                case "messaging/registration-token-not-registered":
                invalidTokens.push(admin.database().ref('/tokens').child(tokensWithKey[i].key).remove())
                break;
                default:
                break;
            }
        });

        return Promise.all(invalidTokens);
    }

    return admin.database().ref('/tokens').once('value').then((data) => {

        if(!data.val()) return;

        const snapshot = data.val();
        const tokens = [];
        const tokensWithKey = [];

        for(let key in snapshot) {
            tokens.push(snapshot[key].token);
            tokensWithKey.push({
                token: snapshot[key].token,
                key: key
            });
        }
        

        return admin.messaging().sendToDevice(tokens, payload)
        .then((response) => cleanInvalidTokens(tokensWithKey, response.results));
        //.then(() => admin.database().ref('/notifications').child(NOTIFICATION_SNAPSHOT.key).remove());
    })
}


// exports.sendNotifications = functions.database.ref('/notifications/{notificationId}').onWrite((event) => {
//     if(event.data.previous.val()) {
//         return;
//     }

//     if(!event.data.exists()) {
//         return;
//     }

//     const NOTIFICATION_SNAPSHOT = event.data;
//     const payload = {
//         notification: {
//             title: `New message from ${NOTIFICATION_SNAPSHOT.val().user}`,
//             body: NOTIFICATION_SNAPSHOT.val().message,
//             icons: NOTIFICATION_SNAPSHOT.val().userProfileImage,
//             click_action: `https://${functions.config().firebase.authDomain}`
//         }
//     };

//     console.info(payload);

//     return admin.database().ref('/tokens').once('value').then((data) => {

//         if(!data.val()) return;

//         const snapshot = data.val();
//         const tokens = [];

//         for(let key in snapshot) {
//             tokens.push(snapshot[key].token)
//         }

//         return admin.messaging().sendToDevice(tokens, payload);
//     })
    
});
