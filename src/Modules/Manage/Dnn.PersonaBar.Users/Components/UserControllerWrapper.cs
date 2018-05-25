using System.Collections.Generic;
using System.Net;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Users;

namespace Dnn.PersonaBar.Users.Components
{
    public class UserControllerWrapper : IUserControllerWrapper
    {
        public UserControllerWrapper()
        {
        }

        public UserInfo GetUser(int value, PortalSettings portalSettings, UserInfo currentUserInfo, out KeyValuePair<HttpStatusCode, string> response)
        {
            throw new System.NotImplementedException();
        }

        public UserInfo GetUserById(int portalID, int value)
        {
            throw new System.NotImplementedException();
        }
    }
}