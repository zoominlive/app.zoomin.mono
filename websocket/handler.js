
const SocketServices = require('../services/socket');
module.exports.connectionHandler = async(event, context, callback) => {
    console.log(event);
    try{
    let connectionId = event?.requestContext?.connectionId || null
    if(event.requestContext.eventType === "CONNECT"){
       
            const t = await sequelize.transaction();
            let socketObj;
            
            socketObj = await SocketServices.getSocketConnection(connectionId, t)
            if(socketObj){
                let updateObj = {connection_id: connectionId};
                await SocketServices.updateSocketConnection(connectionId, updateObj, t);
            }
            else{
                let Obj = {connection_id: connectionId};
                await SocketServices.createSocketConnection(Obj, t)
            }
        
    }
    else if(event.requestContext.eventType === "DISCONNECT"){
        await SocketServices.deleteSocketConnection(connectionId, t)
    }
    else{
        //let connectionId = event?.requestContext?.connectionId || null
        await SocketServices.displayNotification(event, connectionId)
    }
    }
    catch(e){
       console.log(e);
    }
};

module.exports.defaultHandler = (event, context, callback) => {
    console.log('default handle was called')
};
// module.exports.sendMessageHandler = async(event, context, callback) => {
    
// };


