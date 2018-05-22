using Dnn.PersonaBar.Users.Components;
using Dnn.PersonaBar.Users.Components.Contracts;
using Dnn.PersonaBar.Users.Components.Dto;
using Dnn.PersonaBar.Users.Components.Helpers;
using Moq;
using NUnit.Framework;
using System;
using System.Data;

namespace Dnn.PersonaBar.Users.Tests
{
    [TestFixture]
    public class UserControllerSearchTest
    {

        private GetUsersContract usersContract;
        private UsersControllerTestable usersCtrl;

        [SetUp]
        public void Init()
        {
            usersContract = new GetUsersContract
            {
                SearchText = null,
                PageIndex = 0,
                PageSize = 10,
                SortColumn = "displayname",
                SortAscending = true,
                PortalId = 0,
                Filter = UserFilters.All
            };

            usersCtrl = new UsersControllerTestable();
        }

        [Test]
        [TestCase(null, "")]
        [TestCase("", "")]
        [TestCase("search_text", "search_text")]
        [TestCase("*search_text", "%search_text")]
        [TestCase("%search_text", "%search_text")]
        [TestCase("search_text%", "search_text%")]
        [TestCase("search_text*", "search_text%")]
        [TestCase("*search_text*", "%search_text%")]
        [TestCase("%search_text%", "%search_text%")]
        [TestCase("*search_text%", "%search_text%")]
        [TestCase("%search_text*", "%search_text%")]
        [TestCase("*search*_text*", "%search_text%")]
        [TestCase("*search**_text*", "%search_text%")]
        [TestCase("*search*%_text*", "%search_text%")]
        [TestCase("*search%_text*", "%search_text%")]
        public void FilteredSearchTest(string searchText, string expectedFilteredText)
        {
            int totalRecords;
            usersContract.SearchText = searchText;
            usersCtrl.GetUsers(usersContract, true, out totalRecords);

            Assert.AreEqual(usersCtrl.lastSearch, expectedFilteredText);

        }

        private class UsersControllerTestable : UsersController
        {
            private Mock<IDataReader> dataReader;
            
            public string lastSearch { get; set; }

            override protected IDataReader CallGetUsersBySearchTerm(
                GetUsersContract usersContract,
                bool? includeAuthorized,
                bool? includeDeleted,
                bool? includeSuperUsers)
            {

                lastSearch = SearchTextFilter.Apply(usersContract.SearchText);

                dataReader = new Mock<IDataReader>();
                return dataReader.Object;
            }
        }
    }
}
