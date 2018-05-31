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

        private int? _userId;
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
            _userId = 1;
        }

        [Test]
        public void ValidateUser_IfUserIdWithValidValue_ThenSuccessResponse()
        {
            // Arrange
            SetUserInfoWithProfile();
            SetupUserControllerWrapperMock();
            InitializeUserValidator();

            // Act
            var result = _userValidator.ValidateUser(_userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsNull(result);
        }

        [Test]
        public void ValidateUser_IfUserAllowedInSiteGroup_ThenSuccessResponse()
        {
            // Arrange
            SetupForSiteGroup(true);
            InitializeUserValidator();

            // Act
            var result = _userValidator.ValidateUser(_userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsNull(result);
        }


        [Test]
        public void ValidateUser_IfUserNotAllowedInSiteGroup_ThenErrorResponse()
        {
            // Arrange
            SetupForSiteGroup(false);
            InitializeUserValidator();

            // Act
            var result = _userValidator.ValidateUser(_userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsTrue(result.IsError);
        }

        private void SetupForSiteGroup(bool isAllowed)
        {
            _userInfo = null;
            SetupUserControllerWrapperMock();

            var otherPortalId = 2;
            var portals = new ArrayList();
            portals.Add(new PortalInfo() { PortalID = otherPortalId });
            _portalControllerMock.Setup(p => p.GetPortals()).Returns(portals);

            SetUserInfoWithProfile();
            _userControllerWrapperMock.Setup(u => u.GetUserById(It.IsAny<int>(), It.IsAny<int>())).Returns(_userInfo);
            _contentVerifierMock.Setup(c => c.IsContentExistsForRequestedPortal(It.IsAny<int>(), It.IsAny<PortalSettings>(), true)).Returns(isAllowed);
        }

        [Test]
        public void ValidateUser_IfUserIdNotFound_ThenErrorResponse()
        {
            // Arrange
            _userInfo = null;
            SetupUserControllerWrapperMock();

            ArrayList portals = new ArrayList();
            _portalControllerMock.Setup(p => p.GetPortals()).Returns(portals);

            InitializeUserValidator();

            // Act
            var result = _userValidator.ValidateUser(_userId, _portalSettings, null, out _userInfo);

            // Assert
            Assert.IsTrue(result.IsError);
        }

        [Test]
        public void ValidateUser_IfUserIdWithoutValue_ThenErrorResponse()
        {
            // Arrange
            InitializeUserValidator();

            _userId = null;

            // Act
            var result = _userValidator.ValidateUser(_userId, _portalSettings, null, out _userInfo);

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

        private void SetUserInfoWithProfile()
        {
            _userInfo = new UserInfo();
            var profile = new UserProfile();
            profile.FirstName = "testUser";
            _userInfo.UserID = _userId.Value;
            _userInfo.Profile = profile;
        }

        private void SetupUserControllerWrapperMock()
        {
            _userControllerWrapperMock
                .Setup(
                    u => u.GetUser(It.IsAny<int>(),
                    It.IsAny<PortalSettings>(),
                    It.IsAny<UserInfo>(),
                    out response)
                )
                .Returns(_userInfo);
        }
    }
}
