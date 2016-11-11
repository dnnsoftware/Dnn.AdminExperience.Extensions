﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dnn.PersonaBar.SiteSettings.Services.Dto;
using DotNetNuke.Common;
using DotNetNuke.Common.Utilities;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Tabs;
using DotNetNuke.Instrumentation;
using DotNetNuke.Services.Localization;
using Newtonsoft.Json;

namespace Dnn.PersonaBar.SiteSettings.Components
{
    internal class LanguagesControllerTasks
    {
        private static readonly ILog Logger = LoggerSource.Instance.GetLogger(typeof(LanguagesControllerTasks));
        private const string LocalResourcesFile = "~/admin/Dnn.PersonaBar/Modules/SiteSettings/App_LocalResources/SiteSettings.resx";
        private const string LocalizationProgressFile = "PersonaBarLocalizationProgress.txt";

        public static void LocalizeSitePages(LocalizationProgress progress, int portalId, bool translatePages, string defaultLocale)
        {
            Task.Factory.StartNew(() =>
            {
                try
                {
                    var languageCount = LocaleController.Instance.GetLocales(portalId).Count;
                    var pageList = GetPages(portalId);
                    var languageCounter = 0;

                    if (translatePages)
                    {
                        ProcessLanguage(pageList, LocaleController.Instance.GetLocale(defaultLocale),
                            defaultLocale, languageCounter, languageCount, progress);
                    }

                    PublishLanguage(defaultLocale, portalId, true);

                    PortalController.UpdatePortalSetting(portalId, "ContentLocalizationEnabled", "True");

                    // populate other languages
                    foreach (var locale in LocaleController.Instance.GetLocales(portalId).Values)
                    {
                        if (locale.Code != defaultLocale)
                        {
                            languageCounter++;
                            pageList = GetPages(portalId).Where(p => p.CultureCode == defaultLocale).ToList();

                            //add translator role
                            Localization.AddTranslatorRole(portalId, locale);

                            //populate pages
                            ProcessLanguage(pageList, locale, defaultLocale, languageCounter, languageCount, progress);

                            //Map special pages
                            PortalController.Instance.MapLocalizedSpecialPages(portalId, locale.Code);
                        }
                    }

                    //clear portal cache
                    DataCache.ClearPortalCache(portalId, true);
                    progress.Reset();
                    SaveProgressToFile(progress);
                }
                catch (Exception ex)
                {
                    try
                    {
                        Logger.Error(ex);
                        progress.Reset().Error = ex.ToString();
                        SaveProgressToFile(progress);
                    }
                    catch (Exception)
                    {
                        //ignore
                    }
                }
            });
        }

        private static void ProcessLanguage(ICollection<TabInfo> pageList, Locale locale,
            string defaultLocale, int languageCount, int totalLanguages, LocalizationProgress progress)
        {
            progress.PrimaryTotal = totalLanguages;
            progress.PrimaryValue = languageCount;

            var total = pageList.Count;
            if (total == 0)
            {
                progress.SecondaryTotal = 0;
                progress.SecondaryValue = 0;
                progress.SecondaryPercent = 100;
            }

            for (var i = 0; i < total; i++)
            {
                var currentTab = pageList.ElementAt(i);
                var stepNo = i + 1;

                progress.SecondaryTotal = total;
                progress.SecondaryValue = stepNo;
                progress.SecondaryPercent = Convert.ToInt32((float)stepNo / total * 100);
                progress.PrimaryPercent =
                    Convert.ToInt32((languageCount + (float)stepNo / total) / totalLanguages * 100);

                progress.CurrentOperationText = string.Format(Localization.GetString(
                    "ProcessingPage", LocalResourcesFile), locale.Code, stepNo, total, currentTab.TabName);

                progress.TimeEstimated = (total - stepNo) * 100;

                SaveProgressToFile(progress);

                if (locale.Code == defaultLocale)
                {
                    TabController.Instance.LocalizeTab(currentTab, locale, true);
                }
                else
                {
                    TabController.Instance.CreateLocalizedCopy(currentTab, locale, false);
                }
            }
        }

        private static void SaveProgressToFile(LocalizationProgress progress)
        {
            var path = Path.Combine(Globals.ApplicationMapPath, "App_Data", LocalizationProgressFile);
            var text = JsonConvert.SerializeObject(progress);
#if false
            // this could have file locking issues from multiple threads
            File.WriteAllText(path, text);
#else
            using (var file = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.ReadWrite, 256))
            {
                var bytes = Encoding.UTF8.GetBytes(text);
                file.Write(bytes, 0, bytes.Length);
                file.Flush();
            }
#endif
        }

        internal static LocalizationProgress ReadProgressFile()
        {
            var path = Path.Combine(Globals.ApplicationMapPath, "App_Data", LocalizationProgressFile);
#if true
            var text = File.ReadAllText(path);
            return JsonConvert.DeserializeObject<LocalizationProgress>(text);
#else
            using (var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite, 256))
            {
                var bytes = new byte[file.Length];
                file.Read(bytes, 0, bytes.Length);
                var text = Encoding.UTF8.GetString(bytes);
                return JsonConvert.DeserializeObject<LocalizationProgress>(text);
            }
#endif
        }

        private static IList<TabInfo> GetPages(int portalId)
        {
            return (
                from kvp in TabController.Instance.GetTabsByPortal(portalId)
                where !kvp.Value.TabPath.StartsWith("//Admin")
                      && !kvp.Value.IsDeleted
                      && !kvp.Value.IsSystem
                select kvp.Value
                ).ToList();
        }

        private static void PublishLanguage(string cultureCode, int portalId, bool publish)
        {
            var enabledLanguages = LocaleController.Instance.GetLocales(portalId);
            Locale enabledlanguage;
            if (enabledLanguages.TryGetValue(cultureCode, out enabledlanguage))
            {
                enabledlanguage.IsPublished = publish;
                LocaleController.Instance.UpdatePortalLocale(enabledlanguage);
            }
        }
    }
}