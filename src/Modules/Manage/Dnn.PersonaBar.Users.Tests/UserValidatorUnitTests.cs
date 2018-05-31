using System.Collections;
using System.Collections.Generic;
using Moq;
using NUnit.Framework;
using Dnn.PersonaBar.Library.Helper;
using Dnn.PersonaBar.Users.Components;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Users;

namespace Dnn.PersonaBar.Users.Tests
{
    [TestFixture]
    public class UserValidatorUnitTests
    {
        private Mock<IPortalController> _portalControllerMock;
        private Mock<IUserControllerWrapper> _userControllerWrapperMock;
        private Mock<IContentVerifier> _contentVerifierMock;

        private UserInfo _userInfo;
        private UserValidator _userValidator;
        private PortalSettings _portalSettings = null;
        private KeyValuePair<System.Net.HttpStatusCode, string> response;

        [SetUp]
        public void RunBeforeEachTest()
        {
            response = new KeyValuePair<System.Net.HttpStatusCode, string>(System.Net.HttpStatusCode.OK, "User not found");

            _portalControllerMock = new Mock<IPortalController>();
            _userControllerWrapperMock = new Mock<IUserControllerWrapper>();
            _contentVerifierMock = new Mock<IContentVerifier>();

            InitializeUserValidator();
        }

        [Test]
        public void ValidateUser_IfUserIdWithValidValue_ThenSuccessResponse()
        {
            // Arrange
            int? userId = 1;
            _userInfo = GetUserInfoWithProfile(userId.Value);
            SetupUserControllerWrapperMock(_userInfo);            

            // Act
            var result = _userValidator.ValidateUser(userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsNull(result);
        }

        [Test]
        public void ValidateUser_IfUserAllowedInSiteGroup_ThenSuccessResponse()
        {
            // Arrange
            int? userId = 1;
            SetupForSiteGroup(true, userId.Value);            

            // Act
            var result = _userValidator.ValidateUser(userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsNull(result);
        }


        [Test]
        public void ValidateUser_IfUserNotAllowedInSiteGroup_ThenErrorResponse()
        {
            // Arrange
            int? userId = 1;
            SetupForSiteGroup(false, userId.Value);

            // Act
            var result = _userValidator.ValidateUser(userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsTrue(result.IsError);
        }

        [Test]
        public void ValidateUser_IfUserIdNotFound_ThenErrorResponse()
        {
            // Arrange
            int? userId = 1;
            _userInfo = null;
            SetupUserControllerWrapperMock(_userInfo);

            ArrayList portals = new ArrayList();
            _portalControllerMock.Setup(p => p.GetPortals()).Returns(portals);

            // Act
            var result = _userValidator.ValidateUser(userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsTrue(result.IsError);
        }

        [Test]
        public void ValidateUser_IfUserIdWithoutValue_ThenErrorResponse()
        {
            // Arrange
            int? userId = null;

            // Act
            var result = _userValidator.ValidateUser(userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsTrue(result.IsError);
        }

        private void InitializeUserValidator()
        {
            _userValidator = new UserValidator(
                _portalControllerMock.Object,
                _userControllerWrapperMock.Object,
                _contentVerifierMock.Object
            );
        }

        private void SetupUserControllerWrapperMock(UserInfo userInfo)
        {
            _userControllerWrapperMock
                .Setup(
                    u => u.GetUser(It.IsAny<int>(),
                    It.IsAny<PortalSettings>(),
                    It.IsAny<UserInfo>(),
                    out response)
                )
                .Returns(userInfo);
        }

        private void SetupForSiteGroup(bool isAllowed, int userId)
        {
            _userInfo = null;
            SetupUserControllerWrapperMock(_userInfo);

            var otherPortalId = 2;
            var portals = new ArrayList();
            portals.Add(new PortalInfo() { PortalID = otherPortalId });
            _portalControllerMock.Setup(p => p.GetPortals()).Returns(portals);

            var userInfo = GetUserInfoWithProfile(userId);
            _userControllerWrapperMock.Setup(u => u.GetUserById(It.IsAny<int>(), It.IsAny<int>())).Returns(userInfo);
            _contentVerifierMock.Setup(c => c.IsContentExistsForRequestedPortal(It.IsAny<int>(), It.IsAny<PortalSettings>(), true)).Returns(isAllowed);
        }

        private UserInfo GetUserInfoWithProfile(int userId)
        {
            var userInfo = new UserInfo();
            var profile = new UserProfile();
            profile.FirstName = "testUser";
            userInfo.UserID = userId;
            userInfo.Profile = profile;
            return userInfo;
        }
    }
}
