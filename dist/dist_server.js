var express = require('express'),
    app = express();

app.use(express.static(__dirname));

app.listen(9393, function() {
  console.log('listening on port 9393');
});