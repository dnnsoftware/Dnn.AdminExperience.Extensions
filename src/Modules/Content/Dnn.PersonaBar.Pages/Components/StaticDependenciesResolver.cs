using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Urls;

namespace Dnn.PersonaBar.Pages.Components
{
    public class StaticDependenciesResolver : IStaticDependenciesResolver
    {
        public string CleanNameForUrl(string urlPath, FriendlyUrlOptions options, out bool modified)
        {
            return FriendlyUrlController.CleanNameForUrl(urlPath, options, out modified);
        }

        public FriendlyUrlOptions GetExtendOptionsForURLs(int portalId)
        {
            return UrlRewriterUtils.ExtendOptionsForCustomURLs(UrlRewriterUtils.GetOptionsFromSettings(new FriendlyUrlSettings(portalId)));
        }

        public void ValidateUrl(string urlPath, int v, PortalSettings portalSettings, out bool modified)
        {
            FriendlyUrlController.ValidateUrl(urlPath, v, portalSettings, out modified);
        }
    }
}