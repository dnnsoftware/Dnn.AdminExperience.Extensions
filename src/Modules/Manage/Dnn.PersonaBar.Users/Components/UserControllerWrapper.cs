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

        public UserInfo GetUser(int userId, PortalSettings portalSettings, UserInfo currentUserInfo, out KeyValuePair<HttpStatusCode, string> response)
        {
            return UsersController.GetUser(userId, portalSettings, currentUserInfo, out response);
        }

        public UserInfo GetUserById(int portalId, int userId)
        {
            return UserController.GetUserById(portalId, userId);
        }
    }
}