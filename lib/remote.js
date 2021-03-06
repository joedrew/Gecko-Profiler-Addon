/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developer of the Original Code is
 * Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Benoit Girard <bgirard@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

let prefs = require("prefs");

const {Cc,Ci,Cu} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/devtools/dbg-client.jsm");

XPCOMUtils.defineLazyGetter(this, "DebuggerServer", function() {
  Cu.import("resource://gre/modules/devtools/dbg-server.jsm");
  return DebuggerServer;
});

function open_conn() {
  let transport = debuggerSocketConnect("localhost", 6000);
  transport.hooks = {
    onPacket: function(aPacket) {
      dump(JSON.stringify(aPacket) + "\n");
      if (aPacket.profileStr)
        dump("Profile: " + aPacket.profileStr);
      if (aPacket.applicationType)
        transport.send({to: "profiler", type: "getProfileStr"});
    },
    onClosed: function(aStatus) {
      dump("Closed\n");
    },
  };
  transport.ready();
  dump("Opened client\n");
}

function init() {
  // Note we shipped with the default pref value to be true so some users
  // will have this on by default :(, need to do a version convert.
  prefs.default_init_pref("profiler.", "force_dbg_server", false);
  if (false && prefs.get_pref_bool("profiler.", "force_dbg_server", false)) {
    try {
      if (!DebuggerServer.initialized) {
        DebuggerServer.init();
        DebuggerServer.addBrowserActors();
      }

      let port = 6000;
      DebuggerServer.openListener(port, false);
      dump("Profiler dbg server started\n");
      open_conn();
    } catch(e) {
      dump("Remote debugger didn't start: " + e);
    }
  }
}

init();
