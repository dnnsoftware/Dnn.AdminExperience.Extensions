using Moq;
using NUnit.Framework;
using DotNetNuke.Entities.Users;
using DotNetNuke.Entities.Portals;
using Dnn.PersonaBar.Users.Components;
using Dnn.PersonaBar.Library.Prompt.Models;
using Dnn.PersonaBar.Users.Components.Prompt.Commands;

namespace Dnn.PersonaBar.Users.Tests
{
    [TestFixture]
    public class SetUserUnitTests
    {
        private Mock<IUserValidator> _userValidatorMock;
        private Mock<IUsersController> _usersControllerMock;
        private Mock<IUserControllerWrapper> _userControllerWrapperMock;
        private PortalSettings _portalSettings;
        private SetUser _command;
        private int _testPortalId = 0;

        [SetUp]
        public void RunBeforeAnyTest()
        {
            _userValidatorMock = new Mock<IUserValidator>();
            _usersControllerMock = new Mock<IUsersController>();
            _userControllerWrapperMock = new Mock<IUserControllerWrapper>();

            _portalSettings = new PortalSettings();
            _portalSettings.PortalId = _testPortalId;
        }

        [Test]
        public void Run_UserIdNull_ReturnErrorResponse()
        {
            // Arrange
            UserInfo userinfo;
            ConsoleErrorResultModel errorResponse = new ConsoleErrorResultModel();

            _userValidatorMock
                .Setup(u => u.ValidateUser(-1, _portalSettings, null, out userinfo))
                .Returns(errorResponse);

            var args = new[] { "set-user", "", "--username", "testusername", "--firstname", "testfirstname", "--lastname", "testlastname" };
            SetupCommand(args);
            // Act
            var result = _command.Run();

            // Assert
            Assert.IsTrue(result.IsError);
        }

        [TestCase("--email", "user@gm.com")]
        [TestCase("--password", "pass1233")]
        [TestCase("--username", "user4pmt")]
        [TestCase("--displayname", "user4displayname")]
        [TestCase("--approved", "true")]
        public void Run_ValidCommand_ReturnSuccessResponse(string attributeName, string attributeValue)
        {
            // Arrange
            var userId = 4;

            UserInfo userInfo = new UserInfo();
            var profile = new UserProfile();
            profile.FirstName = "testUser";
            userInfo.UserID = userId;
            userInfo.Profile = profile;
            userInfo.FirstName = "userFirstName";
            userInfo.LastName = "userLastName";
            userInfo.Email = "user@email.com";
            userInfo.IsDeleted = false;

            ConsoleErrorResultModel errorResponse = null;
            
            _userValidatorMock.Setup(u => u.GetValidPortalId()).Returns(_testPortalId);
            _userValidatorMock
                .Setup(u => u.ValidateUser(userId, _portalSettings, null, out userInfo))
                .Returns(errorResponse);
            _userControllerWrapperMock
                .Setup(w => w.GetUserById(_testPortalId, userId))
                .Returns(userInfo);

            var args = new[] { "set-user", userId.ToString(), "--firstname", "user4", "--lastname", "user4", attributeName, attributeValue };
            SetupCommand(args);

            // Act
            var result = _command.Run();

            // Assert
            Assert.IsFalse(result.IsError);
            Assert.AreEqual(1, result.Records);
        }

        private void SetupCommand(string[] args)
        {
            _command = new SetUser(_userValidatorMock.Object, _usersControllerMock.Object, _userControllerWrapperMock.Object);
            _command.Initialize(args, _portalSettings, null, -1);
        }
    }
}