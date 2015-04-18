// model for mandrill emails

module.exports = function(app) {
	return app.models.email = (function() {
		// constructor
		function email() {}

		email.snagSuccess = function(msg, subject, user) {
			var fromEmail = "matt@domiventures.co";

			var message = {
				"html": msg,
				"text": null,
				"subject": subject,
				"from_email": fromEmail,
				"from_name": "Domi Station",
				"to": [{
				      "email": user.email,
				      "name": user.company,
				      "type": "to"
				  }],
				"headers": {
				  "Reply-To": fromEmail
				},
				"important": false,
				"track_opens": true,
				"track_clicks": null,
				"auto_text": null,
				"auto_html": null,
				"inline_css": null,
				"url_strip_qs": null,
				"preserve_recipients": null,
				"view_content_link": null,
				"bcc_address": null,            // possibly add one?
				"tracking_domain": null,
				"signing_domain": null,
				"return_path_domain": null,
				"merge": false
				/*
				"global_merge_vars": [{
				      "name": "merge1",
				      "content": "merge1 content"
				  }],
				"merge_vars": [{
				      "rcpt": "recipient.email@example.com",
				      "vars": [{
				              "name": "merge2",
				              "content": "merge2 content"
				          }]
				  }],
				"tags": [
				  "password-resets"
				],
				"subaccount": "customer-123",
				"google_analytics_domains": [
				  "example.com"
				],
				"google_analytics_campaign": "message.from_email@example.com",
				"metadata": {
				  "website": "www.example.com"
				},
				"recipient_metadata": [{
				      "rcpt": "recipient.email@example.com",
				      "values": {
				          "user_id": 123456
				      }
				  }],
				"attachments": [{
				      "type": "text/plain",
				      "name": "myfile.txt",
				      "content": "ZXhhbXBsZSBmaWxl"
				  }],
				"images": [{
				      "type": "image/png",
				      "name": "IMAGECID",
				      "content": "ZXhhbXBsZSBmaWxl"
				  }]
				  */
			};

			var async = false;
			var ip_pool = "Main Pool";        // resets to default ip pool
			var send_at = null;               // have to pay to get this feature

			app.mandrill.messages.send({"message": message, "async": async, "ip_pool": ip_pool, "send_at": send_at}, function(result) {
					console.log('--EMAIL RESULT--:');
					console.log(result);
					/*      example log
					[{
					      "email": "recipient.email@example.com",
					      "status": "sent",
					      "reject_reason": "hard-bounce",
					      "_id": "abc123abc123abc123abc123abc123"
					  }]
					*/
			}, function(e) {
				// Mandrill returns the error as an object with name and message keys
				console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
				// A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
				
				snagError({name: e.name, message: e.message}, user);
			});
		};

		email.snagError = function(err, user, userMessage){
			console.log('--ERROR BELOW--');
			console.log(err);

			var fromEmail = "matt@domiventures.co";
			var now = moment().format();
			var msg = "<body style='color: #303030 !important;'><h1>There was an error!</h1><br /><p>" + err + "</p><br /><p>" + now + "</p></body>";

			var message = {
			  "html": msg,
			  "text": null,
			  "subject": "ERR on Snag A Room",
			  "from_email": fromEmail,
			  "from_name": "Domi Station",
			  "to": [{
			          "email": fromEmail,
			          "name": 'Server Errors',
			          "type": "to"
			      }],
			  "headers": {
			      "Reply-To": fromEmail
			  },
			  "important": false,
			  "track_opens": true,
			  "track_clicks": null,
			  "auto_text": null,
			  "auto_html": null,
			  "inline_css": null,
			  "url_strip_qs": null,
			  "preserve_recipients": null,
			  "view_content_link": null,
			  "bcc_address": null,            // possibly add one?
			  "tracking_domain": null,
			  "signing_domain": null,
			  "return_path_domain": null,
			  "merge": false
			  /*
			  "global_merge_vars": [{
			          "name": "merge1",
			          "content": "merge1 content"
			      }],
			  "merge_vars": [{
			          "rcpt": "recipient.email@example.com",
			          "vars": [{
			                  "name": "merge2",
			                  "content": "merge2 content"
			              }]
			      }],
			  "tags": [
			      "password-resets"
			  ],
			  "subaccount": "customer-123",
			  "google_analytics_domains": [
			      "example.com"
			  ],
			  "google_analytics_campaign": "message.from_email@example.com",
			  "metadata": {
			      "website": "www.example.com"
			  },
			  "recipient_metadata": [{
			          "rcpt": "recipient.email@example.com",
			          "values": {
			              "user_id": 123456
			          }
			      }],
			  "attachments": [{
			          "type": "text/plain",
			          "name": "myfile.txt",
			          "content": "ZXhhbXBsZSBmaWxl"
			      }],
			  "images": [{
			          "type": "image/png",
			          "name": "IMAGECID",
			          "content": "ZXhhbXBsZSBmaWxl"
			      }]
			      */
			};

			var async = false;
			var ip_pool = "Main Pool";        // resets to default ip pool
			var send_at = null;               // have to pay to get this feature

			app.mandrill.messages.send({"message": message, "async": async, "ip_pool": ip_pool, "send_at": send_at}, function(result) {
			  console.log('-- EMAIL RESULT--:');
			  console.log(result);
			  /*      example log
			  [{
			          "email": "recipient.email@example.com",
			          "status": "sent",
			          "reject_reason": "hard-bounce",
			          "_id": "abc123abc123abc123abc123abc123"
			      }]
			  */
			}, function(e) {
			  // Mandrill returns the error as an object with name and message keys
			  console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
			  snagError({name: e.name, message: e.message}, user);
			  // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
			});


			/*  NOW SEND USER AN ERROR EMAIL */
			if(user) {
				var message = {
				    "html": userMessage,
				    "text": null,
				    "subject": "Snag A Room Error",
				    "from_email": fromEmail,
				    "from_name": "Dom the Monster",
				    "to": [{
				            "email": user.email,
				            "name": user.company,
				            "type": "to"
				        }],
				    "headers": {
				        "Reply-To": fromEmail
				    },
				    "important": false,
				    "track_opens": true,
				    "track_clicks": null,
				    "auto_text": null,
				    "auto_html": null,
				    "inline_css": null,
				    "url_strip_qs": null,
				    "preserve_recipients": null,
				    "view_content_link": null,
				    "bcc_address": null,            // possibly add one?
				    "tracking_domain": null,
				    "signing_domain": null,
				    "return_path_domain": null,
				    "merge": false
				    /*
				    "global_merge_vars": [{
				            "name": "merge1",
				            "content": "merge1 content"
				        }],
				    "merge_vars": [{
				            "rcpt": "recipient.email@example.com",
				            "vars": [{
				                    "name": "merge2",
				                    "content": "merge2 content"
				                }]
				        }],
				    "tags": [
				        "password-resets"
				    ],
				    "subaccount": "customer-123",
				    "google_analytics_domains": [
				        "example.com"
				    ],
				    "google_analytics_campaign": "message.from_email@example.com",
				    "metadata": {
				        "website": "www.example.com"
				    },
				    "recipient_metadata": [{
				            "rcpt": "recipient.email@example.com",
				            "values": {
				                "user_id": 123456
				            }
				        }],
				    "attachments": [{
				            "type": "text/plain",
				            "name": "myfile.txt",
				            "content": "ZXhhbXBsZSBmaWxl"
				        }],
				    "images": [{
				            "type": "image/png",
				            "name": "IMAGECID",
				            "content": "ZXhhbXBsZSBmaWxl"
				        }]
				        */
				};

				var async = false;
				var ip_pool = "Main Pool";        // resets to default ip pool
				var send_at = null;               // have to pay to get this feature

				app.mandrill.messages.send({"message": message, "async": async, "ip_pool": ip_pool, "send_at": send_at}, function(result) {
				    console.log('--EMAIL RESULT--:');
				    console.log(result);
				    /*      example log
				    [{
				            "email": "recipient.email@example.com",
				            "status": "sent",
				            "reject_reason": "hard-bounce",
				            "_id": "abc123abc123abc123abc123abc123"
				        }]
				    */
				}, function(e) {
				    // Mandrill returns the error as an object with name and message keys
				    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
				    snagError({name: e.name, message: e.message}, user);
				    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
				});
			}
		};

		return email;
	})();
}