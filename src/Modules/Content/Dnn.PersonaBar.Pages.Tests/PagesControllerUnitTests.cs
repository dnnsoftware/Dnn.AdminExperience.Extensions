using Dnn.PersonaBar.Pages.Components;
using NUnit.Framework;

namespace Dnn.PersonaBar.Pages.Tests
{
    [TestFixture]
    public class PagesControllerUnitTests
    {
        [Test]
        public void Get_IfAbsoluteURLPassed_ShouldBeConvertedToLocaPath()
        {
            // Arrange
            var expected = "/home";
            IPagesController pagesController = new PagesControllerImpl();
            var absoluteURL = "http://www.dnndev.me/home";

            // Act
            string result = pagesController.GetLocalPath(absoluteURL);

            // Assert
            Assert.IsTrue(!result.Contains("http://"), "Local path should not contains http");
            Assert.AreEqual(expected, result);
        }

        [TestCase("child1/news", "/news")]
        [TestCase("community/group", "/group")]
        [TestCase("/", "/")]
        public void Get_IfLocalPathPassed_ShouldBeValidLocalPath(string localPath, string expected)
        {
            // Arrange
            IPagesController pagesController = new PagesControllerImpl();

            // Act
            string result = pagesController.GetLocalPath(localPath);

            // Assert
            Assert.AreEqual(expected, result);
        }
    }
}
