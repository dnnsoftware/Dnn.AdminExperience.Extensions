using DotNetNuke.Framework;
using System;
using DotNetNuke.Entities.Portals;
using Dnn.PersonaBar.Library.Helper;

namespace Dnn.PersonaBar.Common
{
    public class ContentVerifier : ServiceLocator<IContentVerifier, ContentVerifier>, IContentVerifier
    {
        public bool IsContentExistsForRequestedPortal(int portalId, PortalSettings portalSettings, bool checkForSiteGroup = false)
        {
            return PortalHelper.IsContentExistsForRequestedPortal(portalId, portalSettings, checkForSiteGroup);
        }

        #region ServiceLocator
        protected override Func<IContentVerifier> GetFactory()
        {
            return () => new ContentVerifier();
        }

        #endregion
    }
}
