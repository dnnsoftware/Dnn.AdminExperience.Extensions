using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DotNetNuke.Entities.Portals;

namespace Dnn.PersonaBar.Common
{
    public interface IContentVerifier
    {
        bool IsContentExistsForRequestedPortal(int portalID, PortalSettings portalSettings, bool checkForSiteGroup = false);
    }
}
