"use strict";

ibouge.filter("ChatNameFilter", [
  function () {
    return function (chat) {
      if (chat.isGroupChat) {
        return "Group chat";
      }

      return chat.friends.fname + " " + chat.friends.lname;
    };
  },
]);

ibouge.filter("TimeAgoFilter", [
  "$filter",
  function ($filter) {
    return function (time) {
      var now = Date.now();
      var msgTime = new Date(time).getTime();
      var diff = now - msgTime;
      var diffInMin = Math.floor(diff / (60 * 1000));
      if (diffInMin <= 0) {
        return "Now";
      }

      var diffInHours = Math.floor(diff / (60 * 60 * 1000));
      if (diffInHours <= 0) {
        return diffInMin + " minutes ago";
      }

      var diffInDays = Math.floor(diff / (24 * 60 * 60 * 1000));
      if (diffInDays <= 0) {
        return diffInHours + " hours ago";
      }

      var diffInMonths = Math.floor(diff / (31 * 24 * 60 * 60 * 1000));
      if (diffInMonths <= 0) {
        //return diffInDays + ' days ago';
        return $filter("date")(msgTime, "MMM dd, yyyy");
      }

      /*
		var diffInYears = Math.floor(diff/(365 * 24 * 60 * 60 * 1000));
		if (diffInYears <= 0) {
			return diffInMonths + ' months ago';
		} else {
			return diffInYears + ' years ago';
		}
		*/
    };
  },
]);

ibouge.filter("trusted", [
  "$sce",
  function ($sce) {
    return function (url) {
      return $sce.trustAsResourceUrl(url);
    };
  },
]);

ibouge.filter("ReadUnreadFilter", [
  "$rootScope",
  function ($rootScope) {
    return function (chat) {
      /*
		if (!$rootScope.sess || !chat) {
			return null;
		}
		
		var message = chat.messages[0];
		if (!message) {
			return '';
		}
		
		var user_id = $rootScope.sess._id;
		var user = chat.users.filter(function(item) {
			return item.user_id == user_id;
		})[0];
		
		// if the P2P chat is open then mark as read
		// otherwise mark as unread
		var isRead = chat.isOpen ? true : new Date(message.time) < new Date(user.last_logout);
		chat.is_read = isRead;
		return isRead ? 'Read' : 'Unread';
		*/
      return "";
    };
  },
]);

ibouge.filter("InboxFilter", [
  "$http",
  "$rootScope",
  "$sce",
  "UserService",
  "$filter",
  "ReadUnreadFilterFilter",
  function ($http, $rootScope, $sce, UserService, $filter, ReadUnreadFilterFilter) {
    function getImage(item) {
      var content = "";
      if (!item.is_group_chat) {
        if (item.image) {
          content =
            '<img style="min-width: 45px; width: 45px; height: 45px; margin:0 10px; border-radius: 50%;" alt="Image" src="' +
            item.image +
            '">';
        } else {
          content =
            '<img style="min-width: 45px; width: 45px; height: 45px; margin:0 10px; border-radius: 50%;" alt="Image" src="img/upload-photo.png">';
        }
      } else {
        var images = "";
        for (var i = 0; i < 4; i++) {
          if (item.images[i]) {
            if (item.images[i]) {
              images +=
                '<img style="width: 17px; height: 17px; border-radius: 50%; margin: 2px;" alt="Image" src="' +
                item.images[i] +
                '">';
            } else {
              images +=
                '<img style="width: 17px; height: 17px; border-radius: 50%; margin: 2px;" alt="Image" src="img/upload-photo.png">';
            }
          }
        }
        content =
          '<div style="text-align: center: min-width: 45px; width: 45px; height: 45px; margin:0 10px;">\
					' +
          images +
          "\
				</div>";
      }
      return content;
    }

    function getOnline(item) {
      if (!item.is_group_chat) {
        return (
          '<span style="float: right; font-size: 9px; margin: auto 15px auto auto;">\
						<i class="fa fa-circle ' +
          (item.is_online ? "online" : "idle") +
          '" aria-hidden="true" ></i>\
					</span>'
        );
      } else {
        return "";
      }
    }

    function getReadStatus(item) {
      var status = "";
      if (item.messages[0].from_id == $rootScope.sess._id) {
        if (item.messages[0].read_at) {
          status = "Read at " + $filter("date")(item.messages[0].read_at, "hh:mm - MMM dd, yyyy");
        } else {
          status = "Unread";
        }
      }
      return status;
    }

    return function (item) {
      var content =
        getImage(item) +
        '\
				<div style="width: calc(100% - 70px);">\
					<div style="font-weight: 500; font-size: 17px; display: flex;">\
						<span class="no-overflow" style="margin-right: 10px;">' +
        item.name +
        "</span>\
						" +
        getOnline(item) +
        '\
					</div>\
					<div style="color: #a09bb0; font-size: 16px;overflow-wrap: break-word;">' +
        item.messages[0].from +
        " : " +
        (item.messages[0] ? item.messages[0].message : "") +
        '</div>\
					<div style="color: #a09bb0; margin-top: 10px; display: flex; font-size: 15px;">' +
        $filter("date")(item.messages[0] ? item.messages[0].time : "", "MMM dd, yyyy") +
        '<span style="font-size: 5px; margin: auto 5px auto 10px;"><i class="fa fa-circle" aria-hidden="true" ></i></span>' +
        getReadStatus(item) +
        "</div>\
				</div>";

      return $sce.trustAsHtml(content);
    };
  },
]);
