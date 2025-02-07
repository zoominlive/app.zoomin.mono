const connectToDatabase = require("../models/index");

module.exports = {
  createLivestreamCamera: async (camObj, t) => {
    const { LiveStreamCameras } = await connectToDatabase();
    let camCreated = await LiveStreamCameras.create(camObj, { transaction: t });
    return camCreated;
  },

  deleteLivestreamCamera: async (zoneId, t) => {
    const { LiveStreamCameras } = await connectToDatabase();
    let camdeleted = await LiveStreamCameras.destroy(
      {
        where: { zone_id: zoneId },
        raw: true,
      },
      { transaction: t }
    );
    return camdeleted;
  },

  getAllLivestreamCamerasForZone: async (zoneId) => {
    const { LiveStreamCameras } = await connectToDatabase();
    let livestreamcams = await LiveStreamCameras.findAll({where: {zone_id: zoneId}, raw: true});
    return livestreamcams
  },

  getAllLivestreamCameras: async () => {
    const { LiveStreamCameras } = await connectToDatabase();
    let livestreamcams = await LiveStreamCameras.findAll({limit: 1, order: [ [ 'createdAt', 'DESC' ]], raw: true});
    return livestreamcams
  }

};
