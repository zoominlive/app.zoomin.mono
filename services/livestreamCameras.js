const connectToDatabase = require("../models/index");

module.exports = {
  createLivestreamCamera: async (camObj, t) => {
    const { LiveStreamCameras } = await connectToDatabase();
    let camCreated = await LiveStreamCameras.create(camObj, { transaction: t });
    return camCreated;
  },

  deleteLivestreamCamera: async (roomId, t) => {
    const { LiveStreamCameras } = await connectToDatabase();
    let camdeleted = await LiveStreamCameras.destroy(
      {
        where: { room_id: roomId },
        raw: true,
      },
      { transaction: t }
    );
    return camdeleted;
  },

  getAllLivestreamCamerasForRoom: async (roomId) => {
    const { LiveStreamCameras } = await connectToDatabase();
    let livestreamcams = await LiveStreamCameras.findAll({where: {room_id: roomId}, raw: true});
    return livestreamcams
  }

};
