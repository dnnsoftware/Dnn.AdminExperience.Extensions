using Moq;
using NUnit.Framework;
using DotNetNuke.Entities.Tabs;
using DotNetNuke.Entities.Portals;
using Dnn.PersonaBar.Library.Helper;
using Dnn.PersonaBar.Library.Prompt;
using Dnn.PersonaBar.Library.Prompt.Models;
using Dnn.PersonaBar.Pages.Components.Security;
using Dnn.PersonaBar.Pages.Components.Prompt.Commands;

namespace Dnn.PersonaBar.Pages.Tests
{
    [TestFixture]
    public class GetPageUnitTests
    {
        private Mock<ITabController> _tabControllerMock;
        private Mock<IContentVerifier> _contentVerifierMock;
        private Mock<ISecurityService> _securityServiceMock;

        [SetUp]
        public void RunBeforeAnyTest()
        {
            _tabControllerMock = new Mock<ITabController>();
            _securityServiceMock = new Mock<ISecurityService>();
            _contentVerifierMock = new Mock<IContentVerifier>();
        }

        [Test]
        public void Run_GetPageWithValidCommand_ShouldSuccessResponse()
        {
            // Arrange
            var tabId = 21;
            int testPortalId = 1;

            TabInfo tab = new TabInfo();
            tab.TabID = tabId;
            tab.PortalID = testPortalId;

            PortalSettings portalSettings = new PortalSettings();
            portalSettings.PortalId = testPortalId;

            _securityServiceMock.SetReturnsDefault(true);
            _tabControllerMock.Setup(t => t.GetTab(tabId, testPortalId)).Returns(tab);
            _contentVerifierMock.SetReturnsDefault(true);

            IConsoleCommand getCommand = new GetPage(_tabControllerMock.Object, _securityServiceMock.Object, _contentVerifierMock.Object);

            var args = new[] { "get-page", tabId.ToString() };
            getCommand.Initialize(args, portalSettings, null, tabId);

            // Act
            var result = getCommand.Run();

            // Assert
            Assert.IsFalse(result.IsError);
            Assert.IsNotNull(result.Data);
            Assert.AreEqual(1, result.Records);
            Assert.IsFalse(result is ConsoleErrorResultModel);

            _tabControllerMock.Verify(t => t.GetTab(tabId, testPortalId));
            _securityServiceMock.Verify(s => s.CanManagePage(tabId));
            _contentVerifierMock.Verify(c => c.IsContentExistsForRequestedPortal(testPortalId, portalSettings, false));
        }

        [Test]
        public void Run_GetPageWithValidCommandForNonExistingTab_ShouldErrorResponse()
        {
            // Arrange
            var tabId = 212;
            int testPortalId = 1;

            TabInfo nullTab = null;

            TabInfo tab = new TabInfo();
            tab.TabID = tabId;
            tab.PortalID = testPortalId;

            PortalSettings portalSettings = new PortalSettings();
            portalSettings.PortalId = testPortalId;

            _tabControllerMock.SetReturnsDefault(nullTab);
            _securityServiceMock.SetReturnsDefault(true);
            _contentVerifierMock.SetReturnsDefault(false);

            IConsoleCommand getCommand = new GetPage(_tabControllerMock.Object, _securityServiceMock.Object, _contentVerifierMock.Object);

            var args = new[] { "get-page", tabId.ToString() };
            getCommand.Initialize(args, portalSettings, null, tabId);

            // Act
            var result = getCommand.Run();

            // Assert
            Assert.IsTrue(result.IsError);
            Assert.IsTrue(result is ConsoleErrorResultModel);

            _tabControllerMock.Verify(t => t.GetTab(tabId, testPortalId), Times.Once);
            _securityServiceMock.Verify(s => s.CanManagePage(tabId), Times.Never);
            _contentVerifierMock.Verify(c => c.IsContentExistsForRequestedPortal(tabId, portalSettings, false), Times.Never);
        }

        [Test]
        public void Run_GetPageWithValidCommandForRequestedPortalNotAllowed_ShouldErrorResponse()
        {
            // Arrange
            var tabId = 212;
            int testPortalId = 1;

            TabInfo tab = new TabInfo();
            tab.TabID = tabId;
            tab.PortalID = testPortalId;

            PortalSettings portalSettings = new PortalSettings();
            portalSettings.PortalId = testPortalId;

            _tabControllerMock.SetReturnsDefault(tab);
            _securityServiceMock.SetReturnsDefault(true);
            _contentVerifierMock.SetReturnsDefault(false);

            IConsoleCommand getCommand = new GetPage(_tabControllerMock.Object, _securityServiceMock.Object, _contentVerifierMock.Object);

            var args = new[] { "get-page", tabId.ToString() };
            getCommand.Initialize(args, portalSettings, null, tabId);

            // Act
            var result = getCommand.Run();

            // Assert
            Assert.IsTrue(result.IsError);
            Assert.IsTrue(result is ConsoleErrorResultModel);

            _securityServiceMock.Verify(s => s.CanManagePage(tabId), Times.Once);
            _tabControllerMock.Verify(t => t.GetTab(tabId, testPortalId), Times.Once);
            _contentVerifierMock.Verify(c => c.IsContentExistsForRequestedPortal(testPortalId, portalSettings, false), Times.Once);
        }

        [Test]
        public void Run_GetPageWithValidCommandForPortalNotAllowed_ShouldErrorResponse()
        {
            // Arrange
            var tabId = 212;
            int testPortalId = 1;

            TabInfo tab = new TabInfo();
            tab.TabID = tabId;
            tab.PortalID = testPortalId;

            PortalSettings portalSettings = new PortalSettings();
            portalSettings.PortalId = testPortalId;

            _tabControllerMock.SetReturnsDefault(tab);
            _securityServiceMock.SetReturnsDefault(false);
            _contentVerifierMock.SetReturnsDefault(false);

            IConsoleCommand getCommand = new GetPage(_tabControllerMock.Object, _securityServiceMock.Object, _contentVerifierMock.Object);

            var args = new[] { "get-page", tabId.ToString() };
            getCommand.Initialize(args, portalSettings, null, tabId);

            // Act
            var result = getCommand.Run();

            // Assert
            Assert.IsTrue(result.IsError);
            Assert.IsTrue(result is ConsoleErrorResultModel);

            _securityServiceMock.Verify(s => s.CanManagePage(tabId), Times.Once);
            _tabControllerMock.Verify(t => t.GetTab(tabId, testPortalId), Times.Once);
            _contentVerifierMock.Verify(c => c.IsContentExistsForRequestedPortal(testPortalId, portalSettings, false), Times.Never);
        }
    }
}
