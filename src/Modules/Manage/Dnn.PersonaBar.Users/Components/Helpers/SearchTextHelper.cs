﻿using System.Text;
using System.Text.RegularExpressions;

namespace Dnn.PersonaBar.Users.Components.Helpers
{
    public class SearchTextHelper
    {
        public static string Parse(string searchText)
        {
            return prepareSearchString(searchText);
        }

        private static string getInStringSearchPattern(string searchText)
        {
            var pattern = new StringBuilder();
            var regexOptions = RegexOptions.IgnoreCase | RegexOptions.Compiled;
            var inStringRegex = "^(\\*|%)?([\\w\\-_\\*\\%\\.\\@]+)(\\*|%)$";
            var regex = new Regex(inStringRegex, regexOptions);
            var matches = regex.Matches(searchText);

            if (matches.Count > 0)
            {
                var matchText = matches[0].Groups[2].Value;
                if (matchText != null && !string.IsNullOrEmpty(matchText))
                {
                    pattern.Append("%");
                    pattern.Append(matchText.Replace("*", "").Replace("%", ""));
                    pattern.Append("%");

                }
            }
            return pattern.ToString();
        }

        private static string getPrefixSearchPattern(string searchText)
        {
            var regexOptions = RegexOptions.IgnoreCase | RegexOptions.Compiled;
            var pattern = new StringBuilder();
            var prefixRegex = "^(\\*|%)?([\\w\\-_\\*\\%\\.\\@]+)";
            var regex = new Regex(prefixRegex, regexOptions);
            var matches = regex.Matches(searchText);

            if (matches.Count > 0)
            {
                var matchText = matches[0].Groups[2].Value;
                if (matchText != null && !string.IsNullOrEmpty(matchText))
                {
                    pattern.Append("%");
                    pattern.Append(matchText.Replace("*", "").Replace("%", ""));
                }
            }
            return pattern.ToString();
        }

        private static string getSuffixSearchPattern(string searchText)
        {
            var pattern = new StringBuilder();
            var regexOptions = RegexOptions.IgnoreCase | RegexOptions.Compiled;
            var suffixRegex = "([\\w\\-_\\*\\%\\.\\@]+)(\\*|%)$";
            var regex = new Regex(suffixRegex, regexOptions);
            var matches = regex.Matches(searchText);

            if (matches.Count > 0)
            {
                var matchText = matches[0].Groups[1].Value;
                if (matchText != null && !string.IsNullOrEmpty(matchText))
                {
                    pattern.Append(matchText.Replace("*", "").Replace("%", ""));
                    pattern.Append("%");
                }
            }
            return pattern.ToString();
        }

        private static string prepareSearchString(string searchText)
        {
            var pattern = "";

            var prefixWildcard = searchText.StartsWith("%") || searchText.StartsWith("*");
            var suffixWildcard = searchText.EndsWith("%") || searchText.EndsWith("*");

            bool IN_STRING = true == prefixWildcard && true == suffixWildcard;
            bool PREFIX = true == prefixWildcard && false == suffixWildcard;
            bool SUFFIX = true == suffixWildcard && false == prefixWildcard;
            bool EXACT = false == suffixWildcard && false == prefixWildcard;

            if (EXACT)
            {
                pattern = searchText.Replace("*", "").Replace("%", "");
            }
            else
            {

                if (IN_STRING == true)
                {
                    pattern = getInStringSearchPattern(searchText);
                }
                else if (PREFIX == true)
                {
                    pattern = getPrefixSearchPattern(searchText);
                }
                else if (SUFFIX == true)
                {
                    pattern = getSuffixSearchPattern(searchText);
                }
            }

            return pattern;
        }
    }
}