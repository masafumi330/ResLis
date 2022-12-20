var express = require('express');
var router = express.Router();

const localStorage = require("localStorage");
const request = require('request');
const reqp = require('request-promise');

const getAccessToken = () => localStorage.getItem('accessToken');

/* GET mypage listing. */
router.get('/', function (req, res, next) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    res.redirect('/login');
  } else {
    var authOptions = {
      method: 'GET',
      url: 'https://api.spotify.com/v1/me/top/tracks',
      qs: {
        limit: 30,
        time_range: "short_term"
      },
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      json: true
    };
    request(authOptions, function (error, response, body) {
      var songList = body.items;
      res.render('mypage', { songList: songList });
    })
  }
});

router.post('/toptracks', function (req, res, next) {
  const accessToken = getAccessToken();
  console.log("====================");
  console.log("Access Token: " + accessToken);
  console.log("====================");

  var getTopTracksOpt = {
    method: 'GET',
    url: 'https://api.spotify.com/v1/me/top/tracks',
    qs: {
      limit: 30,
      time_range: "short_term"
    },
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    json: true
  };

  var getUserIDOpt = {
    method: 'GET',
    url: 'https://api.spotify.com/v1/me',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    json: true
  };


  async function makePlaylist() {
    try {
      var songListRes = await reqp(getTopTracksOpt);
      var spotifySongURIs = [];
      for (var song of songListRes.items) {
        spotifySongURIs.push(song.uri);
      }
      var userIDRes = await reqp(getUserIDOpt);

      var createEmptyPlaylistOpt = {
        method: 'POST',
        url: `https://api.spotify.com/v1/users/${userIDRes.id}/playlists`,
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "New Playlist test",
          description: "This is the test playlist"
        })
      };

      var createPlaylistRes = await reqp(createEmptyPlaylistOpt);
      var createPlayListJson = JSON.parse(createPlaylistRes);

      var addTracksPlaylistOpt = {
        method: 'POST',
        url: `https://api.spotify.com/v1/playlists/${createPlayListJson.id}/tracks`,
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: spotifySongURIs
        })
      };

      var addTracksPlaylistRes = await reqp(addTracksPlaylistOpt);
    } catch (error) {
      console.error(error);
    }
  }
  makePlaylist();
  console.log("out async");
  res.status(200);
  res.redirect('/mypage');
});

module.exports = router;
