# Maintainer : Shawn Dellysse sdellysse@gmail.com
pkgname=farch
pkgver=0.0.20171203
pkgrel=1
pkgdesc="Functional archlinux system configuration tool"
url="https://github.com/shawndellysse/farch"
arch=("any")
depends=("nodejs")
makedepends=("npm")
source=("https://github.com/shawndellysse/farch/archive/v${pkgver}.tar.gz")

package() {
  cd "${srcdir}/${pkgname}-v${pkgver}"
  
  mkdir -p "${pkgdir}/usr"
  npm install --production --user root -g --prefix="${pkgdir}/usr"
}
