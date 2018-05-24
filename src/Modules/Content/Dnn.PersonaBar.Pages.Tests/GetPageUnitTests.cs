using Moq;
using NUnit.Framework;
using DotNetNuke.Entities.Tabs;
using DotNetNuke.Entities.Portals;
using Dnn.PersonaBar.Library.Helper;
using Dnn.PersonaBar.Library.Prompt;
using Dnn.PersonaBar.Library.Prompt.Models;
using Dnn.PersonaBar.Pages.Components.Security;
using Dnn.PersonaBar.Pages.Components.Prompt.Commands;
using System;

namespace Dnn.PersonaBar.Pages.Tests
{
    [TestFixture]
    public class GetPageUnitTests
    {
        private Mock<ITabController> _tabControllerMock;
        private Mock<IContentVerifier> _contentVerifierMock;
        private Mock<ISecurityService> _securityServiceMock;
        private PortalSettings _portalSettings;
        private IConsoleCommand _getCommand;
        private TabInfo _tab;

        private int _tabId = 21;
        private int _testPortalId = 1;        

        [SetUp]
        public void RunBeforeAnyTest()
        {
            _tab = new TabInfo();
            _tab.TabID = _tabId;
            _tab.PortalID = _testPortalId;

            _portalSettings = new PortalSettings();
            _portalSettings.PortalId = _testPortalId;

            _tabControllerMock = new Mock<ITabController>();
            _securityServiceMock = new Mock<ISecurityService>();
            _contentVerifierMock = new Mock<IContentVerifier>();            
        }

        private void SetupCommand()
        {
            _getCommand = new GetPage(_tabControllerMock.Object, _securityServiceMock.Object, _contentVerifierMock.Object);

            var args = new[] { "get-page", _tabId.ToString() };
            _getCommand.Initialize(args, _portalSettings, null, _tabId);
        }

        [Test]
        public void Run_GetPageWithValidCommand_ShouldSuccessResponse()
        {
            // Arrange
            _securityServiceMock.SetReturnsDefault(true);
            _tabControllerMock.Setup(t => t.GetTab(_tabId, _testPortalId)).Returns(_tab);
            _contentVerifierMock.SetReturnsDefault(true);

            SetupCommand();

            // Act
            var result = _getCommand.Run();

            // Assert
            Assert.IsFalse(result.IsError);
            Assert.IsNotNull(result.Data);
            Assert.AreEqual(1, result.Records);
            Assert.IsFalse(result is ConsoleErrorResultModel);
          }

        [Test]
        public void Run_GetPageWithValidCommandForNonExistingTab_ShouldErrorResponse()
        {
            // Arrange            
            _tab = null;            
            _tabControllerMock.SetReturnsDefault(_tab);
            _securityServiceMock.SetReturnsDefault(true);
            _contentVerifierMock.SetReturnsDefault(false);

            SetupCommand();

            // Act
            var result = _getCommand.Run();

            // Assert
            Assert.IsTrue(result.IsError);
            Assert.IsTrue(result is ConsoleErrorResultModel);
        }

        [Test]
        public void Run_GetPageWithValidCommandForRequestedPortalNotAllowed_ShouldErrorResponse()
        {
            // Arrange            
            _tabControllerMock.SetReturnsDefault(_tab);
            _securityServiceMock.SetReturnsDefault(true);
            _contentVerifierMock.SetReturnsDefault(false);

            SetupCommand();

            // Act
            var result = _getCommand.Run();

            // Assert
            Assert.IsTrue(result.IsError);
            Assert.IsTrue(result is ConsoleErrorResultModel);
        }

        [Test]
        public void Run_GetPageWithValidCommandForPortalNotAllowed_ShouldErrorResponse()
        {
            // Arrange
            _tabControllerMock.SetReturnsDefault(_tab);
            _securityServiceMock.SetReturnsDefault(false);
            _contentVerifierMock.SetReturnsDefault(false);

            SetupCommand();

            // Act
            var result = _getCommand.Run();

            // Assert
            Assert.IsTrue(result.IsError);
            Assert.IsTrue(result is ConsoleErrorResultModel);            
        }
    }
}
