using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Urls;

namespace Dnn.PersonaBar.Pages.Components
{
    public interface IStaticDependenciesResolver
    {
        FriendlyUrlOptions GetExtendOptionsForURLs(int portalId);
        string CleanNameForUrl(string urlPath, FriendlyUrlOptions options, out bool modified);
        void ValidateUrl(string urlPath, int v, PortalSettings portalSettings, out bool modified);
    }
}