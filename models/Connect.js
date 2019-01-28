const mongoose = require('mongoose');

module.exports = () => {
  function connect() {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, function(err) {
      if (err) {
        console.error('mongodb connection error', err);
      }
      mongoose.Promise = global.Promise
      console.log('mongodb connected');
    });
  }
  connect();
  mongoose.connection.on('disconnected', connect);
  
};